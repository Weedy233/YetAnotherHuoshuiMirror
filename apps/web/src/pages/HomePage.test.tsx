import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
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

describe("HomePage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the A-layout hero, snapshot metrics, and API links", async () => {
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

    expect(
      screen.getByRole("heading", { name: "高校教师与课程评价的只读镜像站" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Cloudflare Worker API")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "API 文档" })).toHaveAttribute("href", "/docs");
    expect(screen.getByRole("link", { name: "OpenAPI JSON" })).toHaveAttribute(
      "href",
      "/openapi.json",
    );

    await waitFor(() => expect(screen.getByText("1,900")).toBeInTheDocument());
    expect(screen.getByText("1,793")).toBeInTheDocument();
    expect(screen.getByText("15,928")).toBeInTheDocument();
  });

  it("navigates to search with an encoded query", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ teachers: 0, courses: 0, reviews: 0 }), { status: 200 }),
      ),
    );

    renderHome();
    await userEvent.type(screen.getByLabelText("搜索教师或课程"), "高等 数学");
    await userEvent.click(screen.getByRole("button", { name: /搜索/ }));

    expect(window.location.pathname).toBe("/");
    expect(screen.getByDisplayValue("高等 数学")).toBeInTheDocument();
  });
});
