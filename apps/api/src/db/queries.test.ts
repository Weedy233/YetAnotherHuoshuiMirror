import { describe, expect, it } from "vitest";
import { createFakeD1, fixtureDataset } from "../test/fakeD1";
import { getCourse, getMeta, getReview, getTeacher, getTeacherReviews, search } from "./queries";

const db = createFakeD1(fixtureDataset);

describe("D1 query helpers", () => {
  it("returns snapshot counters", async () => {
    await expect(getMeta(db)).resolves.toEqual({ teachers: 2, courses: 2, reviews: 2 });
  });

  it("searches teachers and courses by keyword", async () => {
    await expect(search(db, "高等")).resolves.toEqual({
      teachers: [],
      courses: [{ id: 10, name: "高等数学" }],
    });
    await expect(search(db, "张")).resolves.toEqual({
      teachers: [{ id: 1, name: "张三" }],
      courses: [],
    });
  });

  it("returns teacher and course summaries with aggregate stats", async () => {
    await expect(getTeacher(db, 1)).resolves.toEqual({
      id: 1,
      name: "张三",
      reviewCount: 2,
      averageTotal: 12.5,
    });
    await expect(getCourse(db, 10)).resolves.toEqual({
      id: 10,
      name: "高等数学",
      reviewCount: 1,
      averageTotal: 14,
    });
  });

  it("returns null for missing detail rows", async () => {
    await expect(getTeacher(db, 999)).resolves.toBeNull();
    await expect(getCourse(db, 999)).resolves.toBeNull();
    await expect(getReview(db, "missing")).resolves.toBeNull();
  });

  it("paginates teacher reviews and maps joined course names", async () => {
    await expect(getTeacherReviews(db, 1, 1, 1)).resolves.toEqual([
      expect.objectContaining({ id: "r1", courseName: "高等数学", rateTotal: 14 }),
    ]);
    await expect(getTeacherReviews(db, 1, 2, 1)).resolves.toEqual([
      expect.objectContaining({ id: "r2", courseName: "大学物理", rateTotal: 11 }),
    ]);
  });

  it("returns a single review with teacher and course names", async () => {
    await expect(getReview(db, "r1")).resolves.toEqual(
      expect.objectContaining({ id: "r1", teacherName: "张三", courseName: "高等数学" }),
    );
  });
});
