import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("combines classes and lets tailwind-merge resolve conflicts", () => {
    expect(cn("rounded-sm", false && "hidden", "rounded-md")).toBe("rounded-md");
  });
});
