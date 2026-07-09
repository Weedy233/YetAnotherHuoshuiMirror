import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CoursePage } from "./CoursePage";

function renderCourse(initialEntry = "/courses/99") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route element={<CoursePage />} path="/courses/:id" />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("CoursePage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders course details", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({ id: 99, name: "高等数学", reviewCount: 12, averageTotal: 4.75 }),
            { status: 200 },
          ),
      ),
    );

    renderCourse();

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "高等数学" })).toBeInTheDocument(),
    );
    expect(screen.getByText("课程编号 #99")).toBeInTheDocument();
    expect(screen.getByText("12 条评价")).toBeInTheDocument();
    expect(screen.getByText("4.75")).toBeInTheDocument();
  });
});
