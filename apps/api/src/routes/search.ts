import type { OpenAPIHono } from "@hono/zod-openapi";
import { createRoute, z } from "@hono/zod-openapi";
import { search } from "../db/queries";
import { CourseSchema, TeacherSchema } from "../schemas/domain";
import type { AppBindings } from "../types";

const SearchQuerySchema = z.object({
  q: z.string().trim().min(1).max(50).openapi({ example: "高等数学" }),
});

const SearchResponseSchema = z
  .object({
    teachers: z.array(TeacherSchema),
    courses: z.array(CourseSchema),
  })
  .openapi("SearchResponse");

const route = createRoute({
  method: "get",
  path: "/api/search",
  tags: ["Search"],
  request: { query: SearchQuerySchema },
  responses: {
    200: {
      content: { "application/json": { schema: SearchResponseSchema } },
      description: "Search teachers and courses by name.",
    },
  },
});

export function registerSearchRoutes(app: OpenAPIHono<AppBindings>) {
  app.openapi(route, async (c) => {
    const { q } = c.req.valid("query");
    return c.json(await search(c.env.DB, q));
  });
}
