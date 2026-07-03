const databaseId = Bun.env.CF_D1_DATABASE_ID;
const databaseName = Bun.env.CF_D1_DATABASE_NAME;

if (!databaseId || !databaseName) {
  throw new Error(
    "Missing CF_D1_DATABASE_ID or CF_D1_DATABASE_NAME. Copy .env.example to .env and fill in the D1 configuration.",
  );
}

const apiDirectory = new URL("../", import.meta.url);
const baseConfig = await Bun.file(new URL("wrangler.base.json", apiDirectory)).json();

const config = {
  ...baseConfig,
  d1_databases: [
    {
      binding: "DB",
      database_name: databaseName,
      database_id: databaseId,
    },
  ],
};

await Bun.write(
  new URL("wrangler.generated.json", apiDirectory),
  `${JSON.stringify(config, null, 2)}\n`,
);
