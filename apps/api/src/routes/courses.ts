import type { OpenAPIHono } from "@hono/zod-openapi";
import { createRoute, z } from "@hono/zod-openapi";
import { getCourse } from "../db/queries";
import { ErrorResponseSchema, IdParamSchema } from "../schemas/common";
import { CourseSchema } from "../schemas/domain";
import type { AppBindings } from "../types";

const CourseDetailSchema = CourseSchema.extend({
  reviewCount: z.number().int(),
  averageTotal: z.number().nullable(),
}).openapi("CourseDetail");

const route = createRoute({
  method: "get",
  path: "/api/courses/{id}",
  tags: ["Courses"],
  request: { params: IdParamSchema },
  responses: {
    200: {
      content: { "application/json": { schema: CourseDetailSchema } },
      description: "Course detail and rating summary.",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Course not found.",
    },
  },
});

export function registerCourseRoutes(app: OpenAPIHono<AppBindings>) {
  app.openapi(route, async (c) => {
    const { id } = c.req.valid("param");
    const course = await getCourse(c.env.DB, id);
    if (!course) {
      return c.json({ error: { code: "NOT_FOUND", message: "Course not found" } }, 404);
    }
    return c.json(course, 200);
  });
}
