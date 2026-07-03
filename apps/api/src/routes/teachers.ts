import type { OpenAPIHono } from "@hono/zod-openapi";
import { createRoute, z } from "@hono/zod-openapi";
import { getTeacher, getTeacherReviews } from "../db/queries";
import { ErrorResponseSchema, IdParamSchema, PaginationQuerySchema } from "../schemas/common";
import { ReviewSchema, TeacherSchema } from "../schemas/domain";
import type { AppBindings } from "../types";

const TeacherDetailSchema = TeacherSchema.extend({
  reviewCount: z.number().int(),
  averageTotal: z.number().nullable(),
}).openapi("TeacherDetail");

const teacherRoute = createRoute({
  method: "get",
  path: "/api/teachers/{id}",
  tags: ["Teachers"],
  request: { params: IdParamSchema },
  responses: {
    200: {
      content: { "application/json": { schema: TeacherDetailSchema } },
      description: "Teacher detail and rating summary.",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Teacher not found.",
    },
  },
});

const reviewsRoute = createRoute({
  method: "get",
  path: "/api/teachers/{id}/reviews",
  tags: ["Teachers"],
  request: { params: IdParamSchema, query: PaginationQuerySchema },
  responses: {
    200: {
      content: { "application/json": { schema: z.object({ items: z.array(ReviewSchema) }) } },
      description: "Paginated teacher reviews.",
    },
  },
});

export function registerTeacherRoutes(app: OpenAPIHono<AppBindings>) {
  app.openapi(teacherRoute, async (c) => {
    const { id } = c.req.valid("param");
    const teacher = await getTeacher(c.env.DB, id);
    if (!teacher) {
      return c.json({ error: { code: "NOT_FOUND", message: "Teacher not found" } }, 404);
    }
    return c.json(teacher, 200);
  });

  app.openapi(reviewsRoute, async (c) => {
    const { id } = c.req.valid("param");
    const { page, pageSize } = c.req.valid("query");
    return c.json({ items: await getTeacherReviews(c.env.DB, id, page, pageSize) });
  });
}
