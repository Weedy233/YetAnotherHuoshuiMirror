import type { OpenAPIHono } from "@hono/zod-openapi";
import { createRoute, z } from "@hono/zod-openapi";
import { getMeta } from "../db/queries";
import type { AppBindings } from "../types";

const MetaResponseSchema = z
  .object({
    teachers: z.number().int(),
    courses: z.number().int(),
    reviews: z.number().int(),
  })
  .openapi("MetaResponse");

const route = createRoute({
  method: "get",
  path: "/api/meta",
  tags: ["Meta"],
  responses: {
    200: {
      content: { "application/json": { schema: MetaResponseSchema } },
      description: "Dataset counters for the mirror snapshot.",
    },
  },
});

export function registerMetaRoutes(app: OpenAPIHono<AppBindings>) {
  app.openapi(route, async (c) => c.json(await getMeta(c.env.DB)));
}
