import "@testing-library/jest-dom/vitest";
import { beforeEach, vi } from "vitest";

beforeEach(() => {
  vi.stubEnv("VITE_API_BASE_URL", "https://api.example.test");
});
