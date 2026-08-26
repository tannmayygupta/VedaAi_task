import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { UploadHeroIllustration } from "./UploadHeroIllustration";

describe("UploadHeroIllustration", () => {
  it("renders the Figma-exported illustration image", () => {
    const { container } = render(<UploadHeroIllustration />);
    const img = container.querySelector("img");
    expect(img).toBeInTheDocument();
    expect(img?.getAttribute("src")).toContain("upload-hero-illustration.svg");
  });
});
