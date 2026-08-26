import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UnmatchedAnswersPanel } from "./UnmatchedAnswersPanel";
import type { AnswerRegion } from "@/lib/schemas/answerRegion";

function makeRegion(overrides: Partial<AnswerRegion> & { id: string }): AnswerRegion {
  return {
    pageIndex: 0,
    boundingBox: { yMin: 0, xMin: 0, yMax: 100, xMax: 100 },
    transcribedText: "Some unmatched text",
    detectedLabel: null,
    matchedQuestionId: null,
    matchConfidence: 0.5,
    continuesFromRegionId: null,
    ...overrides,
  };
}

describe("UnmatchedAnswersPanel", () => {
  it("renders nothing when there are no unmatched regions", () => {
    const { container } = render(
      <UnmatchedAnswersPanel unmatchedRegions={[]} onSelectRegion={vi.fn()} selectedRegionId={null} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders the header with the correct count", () => {
    render(
      <UnmatchedAnswersPanel
        unmatchedRegions={[makeRegion({ id: "r1" }), makeRegion({ id: "r2" })]}
        onSelectRegion={vi.fn()}
        selectedRegionId={null}
      />,
    );
    expect(screen.getByText("Unmatched Answers (2)")).toBeInTheDocument();
  });

  it("starts collapsed and expands on click", async () => {
    render(
      <UnmatchedAnswersPanel
        unmatchedRegions={[makeRegion({ id: "r1", transcribedText: "Doodle text" })]}
        onSelectRegion={vi.fn()}
        selectedRegionId={null}
      />,
    );
    expect(screen.queryByText("Doodle text")).not.toBeInTheDocument();
    await userEvent.click(screen.getByText("Unmatched Answers (1)"));
    expect(screen.getByText("Doodle text")).toBeInTheDocument();
  });

  it("calls onSelectRegion with the clicked region's id", async () => {
    const onSelectRegion = vi.fn();
    render(
      <UnmatchedAnswersPanel
        unmatchedRegions={[makeRegion({ id: "r1", transcribedText: "Doodle text" })]}
        onSelectRegion={onSelectRegion}
        selectedRegionId={null}
      />,
    );
    await userEvent.click(screen.getByText("Unmatched Answers (1)"));
    await userEvent.click(screen.getByText("Doodle text"));
    expect(onSelectRegion).toHaveBeenCalledWith("r1");
  });

  it("visually distinguishes the selected region", async () => {
    render(
      <UnmatchedAnswersPanel
        unmatchedRegions={[
          makeRegion({ id: "r1", transcribedText: "First" }),
          makeRegion({ id: "r2", transcribedText: "Second" }),
        ]}
        onSelectRegion={vi.fn()}
        selectedRegionId="r2"
      />,
    );
    await userEvent.click(screen.getByText("Unmatched Answers (2)"));
    const selected = screen.getByText("Second");
    const unselected = screen.getByText("First");
    expect(selected.className).not.toBe(unselected.className);
  });
});
