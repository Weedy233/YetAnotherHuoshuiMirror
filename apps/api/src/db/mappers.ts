import type { z } from "@hono/zod-openapi";
import type { CourseSchema, ReviewSchema, TeacherSchema } from "../schemas/domain";

type Teacher = z.infer<typeof TeacherSchema>;
type Course = z.infer<typeof CourseSchema>;
type Review = z.infer<typeof ReviewSchema>;

type TeacherRow = { id: number; name: string };
type CourseRow = { id: number; name: string };
type ReviewRow = {
  id: string;
  teacher_id: number;
  course_id: number;
  teacher_name?: string;
  course_name?: string;
  comment: string;
  rate_professionalism: number;
  rate_expressive: number;
  rate_friendliness: number;
  rate_total: number;
  up_vote: number;
  down_vote: number;
};

export function mapTeacher(row: TeacherRow): Teacher {
  return { id: row.id, name: row.name };
}

export function mapCourse(row: CourseRow): Course {
  return { id: row.id, name: row.name };
}

export function mapReview(row: ReviewRow): Review {
  return {
    id: row.id,
    teacherId: row.teacher_id,
    courseId: row.course_id,
    teacherName: row.teacher_name,
    courseName: row.course_name,
    comment: row.comment,
    rateProfessionalism: row.rate_professionalism,
    rateExpressive: row.rate_expressive,
    rateFriendliness: row.rate_friendliness,
    rateTotal: row.rate_total,
    upVote: row.up_vote,
    downVote: row.down_vote,
  };
}
