import { z } from "@hono/zod-openapi";

export const ErrorResponseSchema = z
  .object({
    error: z.object({
      code: z.string().openapi({ example: "NOT_FOUND" }),
      message: z.string().openapi({ example: "Resource not found" }),
    }),
  })
  .openapi("ErrorResponse");

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).openapi({ example: 1 }),
  pageSize: z.coerce.number().int().min(1).max(50).default(20).openapi({ example: 20 }),
});

export const IdParamSchema = z.object({
  id: z.coerce.number().int().positive().openapi({ example: 1 }),
});

export const TextIdParamSchema = z.object({
  id: z.string().min(1).openapi({ example: "review-id" }),
});
