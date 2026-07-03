import { describe, expect, it } from "vitest";
import { mapCourse, mapReview, mapTeacher } from "./mappers";

describe("D1 row mappers", () => {
  it("maps teacher and course rows without changing ids or names", () => {
    expect(mapTeacher({ id: 1, name: "张三" })).toEqual({ id: 1, name: "张三" });
    expect(mapCourse({ id: 10, name: "高等数学" })).toEqual({ id: 10, name: "高等数学" });
  });

  it("maps review snake_case D1 rows to camelCase API models", () => {
    expect(
      mapReview({
        id: "r1",
        teacher_id: 1,
        course_id: 10,
        teacher_name: "张三",
        course_name: "高等数学",
        comment: "讲课清晰",
        rate_professionalism: 5,
        rate_expressive: 4,
        rate_friendliness: 5,
        rate_total: 14,
        up_vote: 9,
        down_vote: 1,
      }),
    ).toEqual({
      id: "r1",
      teacherId: 1,
      courseId: 10,
      teacherName: "张三",
      courseName: "高等数学",
      comment: "讲课清晰",
      rateProfessionalism: 5,
      rateExpressive: 4,
      rateFriendliness: 5,
      rateTotal: 14,
      upVote: 9,
      downVote: 1,
    });
  });
});
