import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SearchPage } from "./SearchPage";

function renderSearch(initialEntry = "/search?q=高等") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route element={<SearchPage />} path="/search" />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("SearchPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders teacher and course results from the API", async () => {
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

    renderSearch();

    await waitFor(() => expect(screen.getByRole("link", { name: "张三" })).toBeInTheDocument());
    expect(screen.getByRole("link", { name: "高等数学" })).toHaveAttribute("href", "/courses/10");
    expect(screen.getByText("过滤器")).toBeInTheDocument();
  });

  it("shows empty states and can submit a new query", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () => new Response(JSON.stringify({ teachers: [], courses: [] }), { status: 200 }),
      ),
    );

    renderSearch("/search");

    expect(screen.getAllByText("暂无结果")).toHaveLength(2);
    await userEvent.type(screen.getByPlaceholderText("搜索教师或课程"), "物理");
    await userEvent.click(screen.getByRole("button", { name: /搜索/ }));
    expect(screen.getByDisplayValue("物理")).toBeInTheDocument();
  });
});
