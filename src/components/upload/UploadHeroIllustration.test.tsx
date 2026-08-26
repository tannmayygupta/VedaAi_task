import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { UploadHeroIllustration } from "./UploadHeroIllustration";

describe("UploadHeroIllustration", () => {
  it("renders the center icon and four orbiting badges without crashing", () => {
    const { container } = render(<UploadHeroIllustration />);
    const svgs = container.querySelectorAll("svg");
    // 1 center icon + 4 orbiting badge icons
    expect(svgs.length).toBe(5);
  });
});
