import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchMeta, searchCatalog } from "./api";

describe("web API client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches metadata as JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ teachers: 2, courses: 3, reviews: 4 }), { status: 200 }),
      ),
    );

    await expect(fetchMeta()).resolves.toEqual({ teachers: 2, courses: 3, reviews: 4 });
    expect(fetch).toHaveBeenCalledWith("/api/meta", { headers: { Accept: "application/json" } });
  });

  it("encodes search keywords and throws on failed responses", async () => {
    const mock = vi.fn(
      async () => new Response(JSON.stringify({ teachers: [], courses: [] }), { status: 200 }),
    );
    vi.stubGlobal("fetch", mock);

    await expect(searchCatalog("高等 数学")).resolves.toEqual({ teachers: [], courses: [] });
    expect(mock).toHaveBeenCalledWith("/api/search?q=%E9%AB%98%E7%AD%89%20%E6%95%B0%E5%AD%A6", {
      headers: { Accept: "application/json" },
    });

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("nope", { status: 500 })),
    );
    await expect(fetchMeta()).rejects.toThrow("API request failed: 500");
  });
});
