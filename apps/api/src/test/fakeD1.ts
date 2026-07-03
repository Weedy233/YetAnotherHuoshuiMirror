type Row = Record<string, unknown>;

type Dataset = {
  teachers: Row[];
  courses: Row[];
  reviews: Row[];
};

function like(value: unknown, pattern: unknown) {
  const needle = String(pattern).replaceAll("%", "");
  return String(value).includes(needle);
}

function reviewWithNames(review: Row, dataset: Dataset) {
  const teacher = dataset.teachers.find((item) => item.id === review.teacher_id);
  const course = dataset.courses.find((item) => item.id === review.course_id);
  return {
    ...review,
    teacher_name: teacher?.name,
    course_name: course?.name,
  };
}

class FakePreparedStatement {
  private params: unknown[] = [];

  constructor(
    private readonly dataset: Dataset,
    private readonly sql: string,
  ) {}

  bind(...params: unknown[]) {
    this.params = params;
    return this;
  }

  async first<T = Row>() {
    const results = await this.all<T>();
    return (results.results[0] as T | undefined) ?? null;
  }

  async all<T = Row>() {
    return { results: this.execute() as T[] };
  }

  private execute(): Row[] {
    const normalized = this.sql.replace(/\s+/g, " ").trim();

    if (normalized === "SELECT COUNT(*) AS count FROM teachers") {
      return [{ count: this.dataset.teachers.length }];
    }
    if (normalized === "SELECT COUNT(*) AS count FROM courses") {
      return [{ count: this.dataset.courses.length }];
    }
    if (normalized === "SELECT COUNT(*) AS count FROM reviews") {
      return [{ count: this.dataset.reviews.length }];
    }
    if (normalized.includes("FROM teachers WHERE name LIKE")) {
      return this.dataset.teachers.filter((row) => like(row.name, this.params[0])).slice(0, 20);
    }
    if (normalized.includes("FROM courses WHERE name LIKE")) {
      return this.dataset.courses.filter((row) => like(row.name, this.params[0])).slice(0, 20);
    }
    if (normalized === "SELECT id, name FROM teachers WHERE id = ?") {
      return this.dataset.teachers.filter((row) => row.id === this.params[0]);
    }
    if (normalized === "SELECT id, name FROM courses WHERE id = ?") {
      return this.dataset.courses.filter((row) => row.id === this.params[0]);
    }
    if (normalized.includes("FROM reviews WHERE teacher_id = ?")) {
      const rows = this.dataset.reviews.filter((row) => row.teacher_id === this.params[0]);
      const total = rows.reduce((sum, row) => sum + Number(row.rate_total), 0);
      return [
        { review_count: rows.length, average_total: rows.length ? total / rows.length : null },
      ];
    }
    if (normalized.includes("FROM reviews WHERE course_id = ?")) {
      const rows = this.dataset.reviews.filter((row) => row.course_id === this.params[0]);
      const total = rows.reduce((sum, row) => sum + Number(row.rate_total), 0);
      return [
        { review_count: rows.length, average_total: rows.length ? total / rows.length : null },
      ];
    }
    if (
      normalized.includes("JOIN courses c ON c.id = r.course_id") &&
      normalized.includes("WHERE r.teacher_id = ?")
    ) {
      const [teacherId, limit, offset] = this.params.map(Number);
      return this.dataset.reviews
        .filter((row) => row.teacher_id === teacherId)
        .sort(
          (a, b) =>
            Number(b.rate_total) - Number(a.rate_total) || Number(b.up_vote) - Number(a.up_vote),
        )
        .slice(offset, offset + limit)
        .map((row) => reviewWithNames(row, this.dataset));
    }
    if (
      normalized.includes("JOIN teachers t ON t.id = r.teacher_id") &&
      normalized.includes("WHERE r.id = ?")
    ) {
      return this.dataset.reviews
        .filter((row) => row.id === this.params[0])
        .map((row) => reviewWithNames(row, this.dataset));
    }

    throw new Error(`Unhandled SQL in fake D1: ${normalized}`);
  }
}

export function createFakeD1(dataset: Dataset): D1Database {
  return {
    prepare(sql: string) {
      return new FakePreparedStatement(dataset, sql);
    },
    async batch(statements: FakePreparedStatement[]) {
      return Promise.all(statements.map((statement) => statement.all()));
    },
  } as unknown as D1Database;
}

export const fixtureDataset: Dataset = {
  teachers: [
    { id: 1, name: "张三" },
    { id: 2, name: "李四" },
  ],
  courses: [
    { id: 10, name: "高等数学" },
    { id: 20, name: "大学物理" },
  ],
  reviews: [
    {
      id: "r1",
      teacher_id: 1,
      course_id: 10,
      comment: "讲课清晰",
      rate_professionalism: 5,
      rate_expressive: 4,
      rate_friendliness: 5,
      rate_total: 14,
      up_vote: 9,
      down_vote: 1,
    },
    {
      id: "r2",
      teacher_id: 1,
      course_id: 20,
      comment: "要求严格",
      rate_professionalism: 4,
      rate_expressive: 4,
      rate_friendliness: 3,
      rate_total: 11,
      up_vote: 3,
      down_vote: 0,
    },
  ],
};
