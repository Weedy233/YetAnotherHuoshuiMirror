import { describe, expect, it } from "vitest";
import app from "./index";
import { createFakeD1, fixtureDataset } from "./test/fakeD1";

const env = { DB: createFakeD1(fixtureDataset) };

async function json(path: string) {
  const response = await app.request(path, undefined, env);
  return { response, body: await response.json() };
}

describe("Worker API routes", () => {
  it("redirects root to interactive docs and exposes OpenAPI JSON", async () => {
    const root = await app.request("/", undefined, env);
    expect(root.status).toBe(302);
    expect(root.headers.get("location")).toBe("/docs");

    const spec = await app.request("/openapi.json", undefined, env);
    const body = (await spec.json()) as { info: { title: string }; paths: Record<string, unknown> };
    expect(spec.status).toBe(200);
    expect(body.info.title).toBe("Huoshui Mirror API");
    expect(body.paths["/api/search"]).toBeDefined();
  });

  it("returns metadata and search results", async () => {
    await expect(json("/api/meta")).resolves.toMatchObject({
      response: expect.objectContaining({ status: 200 }),
      body: { teachers: 2, courses: 2, reviews: 2 },
    });

    await expect(json("/api/search?q=高等")).resolves.toMatchObject({
      response: expect.objectContaining({ status: 200 }),
      body: { teachers: [], courses: [{ id: 10, name: "高等数学" }] },
    });
  });

  it("validates required search query", async () => {
    const response = await app.request("/api/search", undefined, env);
    expect(response.status).toBe(400);
  });

  it("returns detail resources and 404 errors", async () => {
    await expect(json("/api/teachers/1")).resolves.toMatchObject({
      response: expect.objectContaining({ status: 200 }),
      body: { id: 1, name: "张三", reviewCount: 2, averageTotal: 12.5 },
    });
    await expect(json("/api/courses/10")).resolves.toMatchObject({
      response: expect.objectContaining({ status: 200 }),
      body: { id: 10, name: "高等数学", reviewCount: 1, averageTotal: 14 },
    });
    await expect(json("/api/reviews/r1")).resolves.toMatchObject({
      response: expect.objectContaining({ status: 200 }),
      body: expect.objectContaining({ id: "r1", teacherName: "张三", courseName: "高等数学" }),
    });

    await expect(json("/api/teachers/999")).resolves.toMatchObject({
      response: expect.objectContaining({ status: 404 }),
      body: { error: { code: "NOT_FOUND", message: "Teacher not found" } },
    });
    await expect(json("/api/courses/999")).resolves.toMatchObject({
      response: expect.objectContaining({ status: 404 }),
      body: { error: { code: "NOT_FOUND", message: "Course not found" } },
    });
    await expect(json("/api/reviews/missing")).resolves.toMatchObject({
      response: expect.objectContaining({ status: 404 }),
      body: { error: { code: "NOT_FOUND", message: "Review not found" } },
    });
  });

  it("returns paginated teacher reviews and enforces page size validation", async () => {
    await expect(json("/api/teachers/1/reviews?page=2&pageSize=1")).resolves.toMatchObject({
      response: expect.objectContaining({ status: 200 }),
      body: { items: [expect.objectContaining({ id: "r2", courseName: "大学物理" })] },
    });

    const invalid = await app.request("/api/teachers/1/reviews?pageSize=999", undefined, env);
    expect(invalid.status).toBe(400);
  });
});
