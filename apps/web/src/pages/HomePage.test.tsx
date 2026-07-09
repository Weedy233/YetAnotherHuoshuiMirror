import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HomePage } from "./HomePage";

function renderHome() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="location">{`${location.pathname}${location.search}`}</span>;
}

describe("HomePage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders search entry and public stats", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ teachers: 1900, courses: 1793, reviews: 15928 }), {
            status: 200,
          }),
      ),
    );

    renderHome();

    expect(screen.getByRole("heading", { name: "查找教师与课程评价" })).toBeInTheDocument();
    expect(screen.getByText("分别按教师姓名或课程名称查询评分与评价摘要。")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "教师搜索" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "课程搜索" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /按教师浏览/ })).toHaveAttribute(
      "href",
      "/search/teachers",
    );
    expect(screen.getByRole("link", { name: /按课程浏览/ })).toHaveAttribute(
      "href",
      "/search/courses",
    );
    expect(screen.queryByText("综合搜索")).not.toBeInTheDocument();
    expect(screen.queryByText("Cloudflare Worker API")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "API 文档" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "OpenAPI JSON" })).not.toBeInTheDocument();

    await waitFor(() => expect(screen.getByText("1,900")).toBeInTheDocument());
    expect(screen.getByText("1,793")).toBeInTheDocument();
    expect(screen.getByText("15,928")).toBeInTheDocument();
  });

  it("submits teacher and course searches to separate pages", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ teachers: 1900, courses: 1793, reviews: 15928 }), {
            status: 200,
          }),
      ),
    );
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <Routes>
            <Route
              element={
                <>
                  <HomePage />
                  <LocationProbe />
                </>
              }
              path="*"
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await userEvent.type(screen.getByPlaceholderText("搜索教师姓名，例如：陈继兰"), "陈继兰");
    await userEvent.click(screen.getByRole("button", { name: "教师搜索" }));
    expect(screen.getByTestId("location")).toHaveTextContent(
      "/search/teachers?q=%E9%99%88%E7%BB%A7%E5%85%B0",
    );
  });
});
