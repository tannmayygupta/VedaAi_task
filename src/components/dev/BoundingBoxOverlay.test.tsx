import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { BoundingBoxOverlay } from "./BoundingBoxOverlay";

describe("BoundingBoxOverlay", () => {
  it("renders the base image with the given src", () => {
    const { container } = render(<BoundingBoxOverlay imageUrl="/test.png" boxes={[]} />);
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src")).toBe("/test.png");
  });

  it("renders no overlays for an empty boxes array without throwing", () => {
    const { container } = render(<BoundingBoxOverlay imageUrl="/test.png" boxes={[]} />);
    expect(container.querySelectorAll(".border-green-500")).toHaveLength(0);
  });

  it("positions a box using the correct percentage values", () => {
    const { container } = render(
      <BoundingBoxOverlay
        imageUrl="/test.png"
        boxes={[{ id: "r1", boundingBox: { yMin: 250, xMin: 500, yMax: 750, xMax: 1000 } }]}
      />,
    );
    const box = container.querySelector(".border-green-500") as HTMLElement;
    expect(box).not.toBeNull();
    expect(box.style.top).toBe("25%");
    expect(box.style.left).toBe("50%");
    expect(box.style.width).toBe("50%");
    expect(box.style.height).toBe("50%");
  });

  it("renders a label when provided", () => {
    const { getByText } = render(
      <BoundingBoxOverlay
        imageUrl="/test.png"
        boxes={[{ id: "r1", boundingBox: { yMin: 0, xMin: 0, yMax: 100, xMax: 100 }, label: "Q2" }]}
      />,
    );
    expect(getByText("Q2")).toBeInTheDocument();
  });
});
