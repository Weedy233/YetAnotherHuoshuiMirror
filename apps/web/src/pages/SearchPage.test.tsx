import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SearchPage } from "./SearchPage";

function renderTeacherSearch(initialEntry = "/search/teachers?q=陈") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route element={<SearchPage mode="teachers" />} path="/search/teachers" />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function renderCourseSearch(initialEntry = "/search/courses?q=数学") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route element={<SearchPage mode="courses" />} path="/search/courses" />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("SearchPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the teacher-only search layout", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              teachers: [{ id: 1, name: "张三" }],
              courses: [{ id: 10, name: "高等数学" }],
            }),
            { status: 200 },
          ),
      ),
    );

    renderTeacherSearch();

    await waitFor(() => expect(screen.getByRole("link", { name: "张三" })).toBeInTheDocument());
    expect(screen.queryByRole("link", { name: "高等数学" })).not.toBeInTheDocument();
    expect(screen.queryByText("综合搜索")).not.toBeInTheDocument();
    expect(screen.queryByText("搜索入口聚焦教师姓名")).not.toBeInTheDocument();
  });

  it("shows empty states and can submit a teacher query", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () => new Response(JSON.stringify({ teachers: [], courses: [] }), { status: 200 }),
      ),
    );

    renderTeacherSearch("/search/teachers");

    expect(screen.getByText("暂无结果")).toBeInTheDocument();
    await userEvent.type(screen.getByPlaceholderText("搜索教师姓名，例如：陈继兰"), "物理");
    await userEvent.click(screen.getByRole("button", { name: /搜索/ }));
    expect(screen.getByDisplayValue("物理")).toBeInTheDocument();
  });

  it("shows user-friendly errors instead of silently rendering empty results", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("proxy error", { status: 502 })),
    );

    renderTeacherSearch("/search/teachers?q=陈继兰");

    await waitFor(() =>
      expect(screen.getByText(/搜索失败：暂时无法获取搜索结果，请稍后重试。/)).toBeInTheDocument(),
    );
  });

  it("renders the course-only search layout", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              teachers: [{ id: 1, name: "陈继兰" }],
              courses: [{ id: 10, name: "高等数学" }],
            }),
            { status: 200 },
          ),
      ),
    );

    renderCourseSearch();

    await waitFor(() => expect(screen.getByRole("link", { name: "高等数学" })).toBeInTheDocument());
    expect(screen.queryByRole("link", { name: "陈继兰" })).not.toBeInTheDocument();
    expect(screen.queryByText("搜索入口聚焦课程名称")).not.toBeInTheDocument();
  });
});
