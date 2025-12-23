import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn utility", () => {
  it("merges class names", () => {
    expect(cn("class1", "class2")).toBe("class1 class2");
  });

  it("handles conditional classes", () => {
    const isActive = true;
    const isHidden = false;
    expect(cn("base", isActive && "conditional", isHidden && "hidden")).toBe(
      "base conditional"
    );
  });

  it("handles undefined and null", () => {
    expect(cn("base", undefined, null, "end")).toBe("base end");
  });

  it("merges Tailwind classes correctly", () => {
    // tailwind-merge should handle conflicting classes
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("handles empty input", () => {
    expect(cn()).toBe("");
  });

  it("handles arrays", () => {
    expect(cn(["class1", "class2"])).toBe("class1 class2");
  });

  it("handles objects", () => {
    expect(cn({ class1: true, class2: false, class3: true })).toBe(
      "class1 class3"
    );
  });

  it("handles complex combinations", () => {
    expect(
      cn(
        "base",
        ["array1", "array2"],
        { conditional: true, hidden: false },
        undefined,
        "end"
      )
    ).toBe("base array1 array2 conditional end");
  });
});
