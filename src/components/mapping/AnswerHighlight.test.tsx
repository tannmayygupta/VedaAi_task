import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AnswerHighlight } from "./AnswerHighlight";
import { bboxToPercent } from "@/lib/mapping/bboxToPercent";

describe("AnswerHighlight", () => {
  it("positions the highlight box using bboxToPercent's exact output", () => {
    const boundingBox = { yMin: 250, xMin: 500, yMax: 750, xMax: 1000 };
    const expected = bboxToPercent(boundingBox);

    const { container } = render(<AnswerHighlight boundingBox={boundingBox} label="Q2" />);
    const box = container.querySelector(".border-highlight-border") as HTMLElement;

    expect(box).not.toBeNull();
    expect(box.style.top).toBe(expected.top);
    expect(box.style.left).toBe(expected.left);
    expect(box.style.width).toBe(expected.width);
    expect(box.style.height).toBe(expected.height);
  });

  it("renders the label text", () => {
    render(
      <AnswerHighlight boundingBox={{ yMin: 0, xMin: 0, yMax: 10, xMax: 10 }} label="Q2" />,
    );
    expect(screen.getByText("Q2")).toBeInTheDocument();
  });
});
