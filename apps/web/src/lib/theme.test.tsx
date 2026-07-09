import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ThemeToggle } from "../components/ThemeToggle";
import { ThemeProvider, useTheme } from "./theme";

const storageKey = "huoshui-mirror-theme";

type ThemeListener = (event: MediaQueryListEvent) => void;

function installMatchMedia(matches: boolean) {
  let listener: ThemeListener | undefined;
  const media = {
    matches,
    media: "(prefers-color-scheme: dark)",
    onchange: null,
    addEventListener: vi.fn((_type: string, next: EventListenerOrEventListenerObject) => {
      listener = next as ThemeListener;
    }),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
  } as unknown as MediaQueryList;

  const matchMedia = vi.fn(() => media);
  vi.stubGlobal("matchMedia", matchMedia);

  return {
    matchMedia,
    media,
    emit(nextMatches: boolean) {
      act(() => listener?.({ matches: nextMatches } as MediaQueryListEvent));
    },
  };
}

function ThemeValue() {
  const { theme } = useTheme();
  return <span>{theme}</span>;
}

function InvalidConsumer() {
  useTheme();
  return null;
}

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.documentElement.classList.remove("dark");
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.style.colorScheme = "";
});

describe("theme", () => {
  it("requires consumers to be wrapped in ThemeProvider", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => render(<InvalidConsumer />)).toThrow("useTheme must be used within ThemeProvider");
  });

  it("restores the stored theme and toggles both directions", async () => {
    window.localStorage.setItem(storageKey, "dark");
    const { matchMedia } = installMatchMedia(false);
    const user = userEvent.setup();

    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );

    expect(document.documentElement).toHaveClass("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.documentElement.style.colorScheme).toBe("dark");
    expect(matchMedia).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "切换到浅色模式" }));
    expect(document.documentElement).not.toHaveClass("dark");
    expect(window.localStorage.getItem(storageKey)).toBe("light");

    await user.click(screen.getByRole("button", { name: "切换到深色模式" }));
    expect(document.documentElement).toHaveClass("dark");
    expect(window.localStorage.getItem(storageKey)).toBe("dark");
  });

  it("uses the system preference and reacts to preference changes", () => {
    window.localStorage.setItem(storageKey, "invalid");
    const { emit, media } = installMatchMedia(true);
    const view = render(
      <ThemeProvider>
        <ThemeValue />
      </ThemeProvider>,
    );

    expect(screen.getByText("dark")).toBeInTheDocument();
    expect(media.addEventListener).toHaveBeenCalledWith("change", expect.any(Function));

    emit(false);
    expect(screen.getByText("light")).toBeInTheDocument();
    expect(document.documentElement.dataset.theme).toBe("light");

    view.unmount();
    expect(media.removeEventListener).toHaveBeenCalledWith("change", expect.any(Function));
  });

  it("falls back to light mode when matchMedia is unavailable", () => {
    vi.stubGlobal("matchMedia", undefined);

    render(
      <ThemeProvider>
        <ThemeValue />
      </ThemeProvider>,
    );

    expect(screen.getByText("light")).toBeInTheDocument();
    expect(document.documentElement.dataset.theme).toBe("light");
  });
});
