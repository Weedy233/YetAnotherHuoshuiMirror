import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
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

  it("renders snapshot metrics and API links", async () => {
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
});
