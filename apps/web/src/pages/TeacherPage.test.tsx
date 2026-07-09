import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TeacherPage } from "./TeacherPage";

function renderTeacher(initialEntry = "/teachers/1732") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route element={<TeacherPage />} path="/teachers/:id" />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("TeacherPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders teacher details and review list", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url === "https://api.example.test/api/teachers/1732") {
          return new Response(
            JSON.stringify({ id: 1732, name: "陈继兰", reviewCount: 10, averageTotal: 5.5 }),
            { status: 200 },
          );
        }
        if (url === "https://api.example.test/api/teachers/1732/reviews?page=1&pageSize=20") {
          return new Response(
            JSON.stringify({
              items: [
                {
                  id: "r1",
                  teacherId: 1732,
                  courseId: 99,
                  courseName: "高等数学",
                  comment: "讲课清楚。",
                  rateProfessionalism: 5,
                  rateExpressive: 6,
                  rateFriendliness: 5,
                  rateTotal: 5.5,
                  upVote: 3,
                  downVote: 1,
                },
              ],
            }),
            { status: 200 },
          );
        }
        return new Response("not found", { status: 404 });
      }),
    );

    renderTeacher();

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "陈继兰" })).toBeInTheDocument(),
    );
    expect(screen.getByText("教师编号 #1732")).toBeInTheDocument();
    expect(screen.getByText("10 条评价")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /高等数学/ })).toHaveAttribute("href", "/courses/99");
    expect(screen.getByText("讲课清楚。")).toBeInTheDocument();
  });
});
