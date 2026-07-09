import { spawn } from "node:child_process";
import { mkdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { Log, LogLevel, Miniflare } from "miniflare";

const projectRoot = resolve(import.meta.dir, "../../..");
const apiRoot = resolve(import.meta.dir, "..");
const port = Number(process.env.PORT ?? 8787);
const host = process.env.HOST ?? "127.0.0.1";
const dbId = process.env.MF_D1_DATABASE_ID ?? "huoshui-mirror-local";
const seedPort = Number(process.env.MF_SEED_PORT ?? port + 1);
const runtimeRoot = await mkdir(join(tmpdir(), `huoshui-mirror-miniflare-${Date.now()}`), {
  recursive: true,
});
const bundlePath = join(runtimeRoot, "worker.mjs");
const stateDir = join(runtimeRoot, "state");

function splitSql(sql: string) {
  const statements: string[] = [];
  let current = "";
  let inString = false;

  for (let i = 0; i < sql.length; i += 1) {
    const char = sql[i];
    const next = sql[i + 1];
    current += char;

    if (char === "'") {
      if (inString && next === "'") {
        current += next;
        i += 1;
      } else {
        inString = !inString;
      }
    } else if (char === ";" && !inString) {
      const statement = current.trim();
      current = "";
      if (statement && !/^PRAGMA\b/i.test(statement)) statements.push(statement);
    }
  }

  const tail = current.trim();
  if (tail && !/^PRAGMA\b/i.test(tail)) statements.push(tail);
  return statements;
}

function run(command: string, args: string[], cwd: string) {
  return new Promise<void>((resolvePromise, reject) => {
    const child = spawn(command, args, { cwd, stdio: "inherit" });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`${command} ${args.join(" ")} failed with exit code ${code}`));
    });
  });
}

async function requestJson<T>(mf: Miniflare, path: string, init?: RequestInit): Promise<T> {
  const response = await mf.dispatchFetch(`http://local.test${path}`, init);
  const text = await response.text();
  if (!response.ok) throw new Error(`${path} returned ${response.status}: ${text}`);
  return JSON.parse(text) as T;
}

async function seedGroup(mf: Miniflare, name: string, statements: string[], chunkSize: number) {
  let done = 0;
  for (let index = 0; index < statements.length; index += chunkSize) {
    const chunk = statements.slice(index, index + chunkSize);
    await requestJson(mf, "/seed", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(chunk),
    });
    done += chunk.length;
    if (done === statements.length) console.log(`Seeded ${name}: ${done}`);
  }
}

await run(
  "bun",
  ["build", "src/index.ts", "--target=browser", "--format=esm", "--outfile", bundlePath],
  apiRoot,
);

const importSql = await readFile(join(projectRoot, "d1/import.sql"), "utf8");
const allStatements = splitSql(importSql);
const groups = {
  createCourses: allStatements.filter((statement) => /^CREATE TABLE\s+courses\b/i.test(statement)),
  createTeachers: allStatements.filter((statement) =>
    /^CREATE TABLE\s+teachers\b/i.test(statement),
  ),
  createReviews: allStatements.filter((statement) => /^CREATE TABLE\s+"reviews"/i.test(statement)),
  insertCourses: allStatements.filter((statement) => /^INSERT INTO\s+"courses"/i.test(statement)),
  insertTeachers: allStatements.filter((statement) => /^INSERT INTO\s+"teachers"/i.test(statement)),
  insertReviews: allStatements.filter((statement) => /^INSERT INTO\s+"reviews"/i.test(statement)),
};

const seedWorker = `export default { async fetch(req, env) {
  const url = new URL(req.url);
  if (url.pathname === '/seed') {
    const statements = await req.json();
    const result = await env.DB.batch(statements.map((sql) => env.DB.prepare(sql)));
    return Response.json({ count: statements.length, resultCount: result.length });
  }
  if (url.pathname === '/count') {
    const [teachers, courses, reviews] = await env.DB.batch([
      env.DB.prepare('SELECT COUNT(*) AS count FROM teachers'),
      env.DB.prepare('SELECT COUNT(*) AS count FROM courses'),
      env.DB.prepare('SELECT COUNT(*) AS count FROM reviews'),
    ]);
    return Response.json({
      teachers: teachers.results[0].count,
      courses: courses.results[0].count,
      reviews: reviews.results[0].count,
    });
  }
  return new Response('not found', { status: 404 });
} }`;

const seedMf = new Miniflare({
  script: seedWorker,
  modules: true,
  compatibilityDate: "2026-07-03",
  d1Databases: { DB: dbId },
  defaultPersistRoot: stateDir,
  host,
  port: seedPort,
  log: new Log(LogLevel.WARN),
});

try {
  await seedGroup(seedMf, "schema", [...groups.createCourses, ...groups.createTeachers], 50);
  await seedGroup(seedMf, "courses", groups.insertCourses, 500);
  await seedGroup(seedMf, "teachers", groups.insertTeachers, 500);
  await seedGroup(seedMf, "reviews schema", groups.createReviews, 50);
  await seedGroup(seedMf, "reviews", groups.insertReviews, 250);
  const counts = await requestJson(seedMf, "/count");
  console.log("D1 seed counts:", counts);
} finally {
  await seedMf.dispose();
}

const script = await readFile(bundlePath, "utf8");
const apiMf = new Miniflare({
  script,
  modules: true,
  compatibilityDate: "2026-07-03",
  d1Databases: { DB: dbId },
  defaultPersistRoot: stateDir,
  host,
  port,
  log: new Log(LogLevel.INFO),
});

const url = await apiMf.ready;
console.log(`Huoshui Mirror API ready: ${url.href}`);
console.log(`Try: ${url.href}api/search?q=%E9%99%88%E7%BB%A7%E5%85%B0`);

await new Promise<void>((resolvePromise) => {
  const stop = async () => {
    await apiMf.dispose();
    resolvePromise();
  };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
});
