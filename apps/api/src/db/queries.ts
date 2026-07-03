import { mapCourse, mapReview, mapTeacher } from "./mappers";

export async function getMeta(db: D1Database) {
  const [teachers, courses, reviews] = await db.batch([
    db.prepare("SELECT COUNT(*) AS count FROM teachers"),
    db.prepare("SELECT COUNT(*) AS count FROM courses"),
    db.prepare("SELECT COUNT(*) AS count FROM reviews"),
  ]);

  return {
    teachers: Number((teachers.results[0] as { count?: number } | undefined)?.count ?? 0),
    courses: Number((courses.results[0] as { count?: number } | undefined)?.count ?? 0),
    reviews: Number((reviews.results[0] as { count?: number } | undefined)?.count ?? 0),
  };
}

export async function search(db: D1Database, q: string) {
  const keyword = `%${q.trim()}%`;
  const [teachers, courses] = await db.batch([
    db
      .prepare("SELECT id, name FROM teachers WHERE name LIKE ? ORDER BY name LIMIT 20")
      .bind(keyword),
    db
      .prepare("SELECT id, name FROM courses WHERE name LIKE ? ORDER BY name LIMIT 20")
      .bind(keyword),
  ]);

  return {
    teachers: teachers.results.map((row) => mapTeacher(row as { id: number; name: string })),
    courses: courses.results.map((row) => mapCourse(row as { id: number; name: string })),
  };
}

export async function getTeacher(db: D1Database, id: number) {
  const teacher = await db.prepare("SELECT id, name FROM teachers WHERE id = ?").bind(id).first();
  if (!teacher) return null;

  const stats = await db
    .prepare(
      `SELECT COUNT(*) AS review_count, ROUND(AVG(rate_total), 2) AS average_total
       FROM reviews WHERE teacher_id = ?`,
    )
    .bind(id)
    .first<{ review_count: number; average_total: number | null }>();

  return {
    ...mapTeacher(teacher as { id: number; name: string }),
    reviewCount: Number(stats?.review_count ?? 0),
    averageTotal: stats?.average_total ?? null,
  };
}

export async function getCourse(db: D1Database, id: number) {
  const course = await db.prepare("SELECT id, name FROM courses WHERE id = ?").bind(id).first();
  if (!course) return null;

  const stats = await db
    .prepare(
      `SELECT COUNT(*) AS review_count, ROUND(AVG(rate_total), 2) AS average_total
       FROM reviews WHERE course_id = ?`,
    )
    .bind(id)
    .first<{ review_count: number; average_total: number | null }>();

  return {
    ...mapCourse(course as { id: number; name: string }),
    reviewCount: Number(stats?.review_count ?? 0),
    averageTotal: stats?.average_total ?? null,
  };
}

export async function getTeacherReviews(
  db: D1Database,
  id: number,
  page: number,
  pageSize: number,
) {
  const offset = (page - 1) * pageSize;
  const rows = await db
    .prepare(
      `SELECT r.*, c.name AS course_name
       FROM reviews r
       JOIN courses c ON c.id = r.course_id
       WHERE r.teacher_id = ?
       ORDER BY r.rate_total DESC, r.up_vote DESC
       LIMIT ? OFFSET ?`,
    )
    .bind(id, pageSize, offset)
    .all();

  return rows.results.map((row) => mapReview(row as never));
}

export async function getReview(db: D1Database, id: string) {
  const row = await db
    .prepare(
      `SELECT r.*, t.name AS teacher_name, c.name AS course_name
       FROM reviews r
       JOIN teachers t ON t.id = r.teacher_id
       JOIN courses c ON c.id = r.course_id
       WHERE r.id = ?`,
    )
    .bind(id)
    .first();

  return row ? mapReview(row as never) : null;
}
