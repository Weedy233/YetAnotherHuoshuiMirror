import type { OpenAPIHono } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import { getReview } from "../db/queries";
import { ErrorResponseSchema, TextIdParamSchema } from "../schemas/common";
import { ReviewSchema } from "../schemas/domain";
import type { AppBindings } from "../types";

const route = createRoute({
  method: "get",
  path: "/api/reviews/{id}",
  tags: ["Reviews"],
  request: { params: TextIdParamSchema },
  responses: {
    200: {
      content: { "application/json": { schema: ReviewSchema } },
      description: "Single review detail.",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Review not found.",
    },
  },
});

export function registerReviewRoutes(app: OpenAPIHono<AppBindings>) {
  app.openapi(route, async (c) => {
    const { id } = c.req.valid("param");
    const review = await getReview(c.env.DB, id);
    if (!review) {
      return c.json({ error: { code: "NOT_FOUND", message: "Review not found" } }, 404);
    }
    return c.json(review, 200);
  });
}
