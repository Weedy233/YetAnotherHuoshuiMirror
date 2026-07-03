import { z } from "@hono/zod-openapi";

export const TeacherSchema = z
  .object({
    id: z.number().int(),
    name: z.string(),
  })
  .openapi("Teacher");

export const CourseSchema = z
  .object({
    id: z.number().int(),
    name: z.string(),
  })
  .openapi("Course");

export const ReviewSchema = z
  .object({
    id: z.string(),
    teacherId: z.number().int(),
    courseId: z.number().int(),
    teacherName: z.string().optional(),
    courseName: z.string().optional(),
    comment: z.string(),
    rateProfessionalism: z.number().int(),
    rateExpressive: z.number().int(),
    rateFriendliness: z.number().int(),
    rateTotal: z.number().int(),
    upVote: z.number().int(),
    downVote: z.number().int(),
  })
  .openapi("Review");
