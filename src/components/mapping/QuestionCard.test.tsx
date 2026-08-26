import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuestionCard, LOW_CONFIDENCE_TOOLTIP, HANDWRITING_MISMATCH_TOOLTIP } from "./QuestionCard";

function renderCard(overrides: Partial<Parameters<typeof QuestionCard>[0]> = {}) {
  const onToggleExpand = vi.fn();
  render(
    <QuestionCard
      displayLabel="1"
      questionText="Name the largest planet in our solar system."
      scoreLabel="2 / 2"
      scoreTier="full"
      feedback={null}
      isExpanded={false}
      onToggleExpand={onToggleExpand}
      {...overrides}
    />,
  );
  return { onToggleExpand };
}

describe("QuestionCard", () => {
  it("renders the question text and score label", () => {
    renderCard();
    expect(screen.getByText("Name the largest planet in our solar system.")).toBeInTheDocument();
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
  });

  it("renders the sub-part badge only when subpartLetter is provided", () => {
    const { rerender } = render(
      <QuestionCard
        displayLabel="11 (a)"
        subpartLetter="a"
        questionText="Sub-part question"
        scoreLabel="1 / 2"
        scoreTier="partial"
        feedback={null}
        isExpanded={false}
        onToggleExpand={() => {}}
      />,
    );
    expect(screen.getByText("a.")).toBeInTheDocument();

    rerender(
      <QuestionCard
        displayLabel="1"
        questionText="Top-level question"
        scoreLabel="2 / 2"
        scoreTier="full"
        feedback={null}
        isExpanded={false}
        onToggleExpand={() => {}}
      />,
    );
    expect(screen.queryByText("a.")).not.toBeInTheDocument();
  });

  it("calls onToggleExpand when the chevron button is clicked", async () => {
    const { onToggleExpand } = renderCard();
    await userEvent.click(screen.getByRole("button", { name: /toggle question details/i }));
    expect(onToggleExpand).toHaveBeenCalledTimes(1);
  });

  it("does not render the AI Feedback panel when collapsed, even if feedback is provided", () => {
    renderCard({ isExpanded: false, feedback: "Great job!" });
    expect(screen.queryByText("AI Feedback")).not.toBeInTheDocument();
    expect(screen.queryByText("Great job!")).not.toBeInTheDocument();
  });

  it("renders the AI Feedback panel when expanded with non-null feedback", () => {
    renderCard({ isExpanded: true, feedback: "Great job!" });
    expect(screen.getByText("AI Feedback")).toBeInTheDocument();
    expect(screen.getByText("Great job!")).toBeInTheDocument();
  });

  it("renders no feedback panel when expanded but feedback is null", () => {
    renderCard({ isExpanded: true, feedback: null });
    expect(screen.queryByText("AI Feedback")).not.toBeInTheDocument();
  });

  it("does not render a 'Verify' badge by default", () => {
    renderCard();
    expect(screen.queryByText("Verify")).not.toBeInTheDocument();
  });

  it("renders a 'Verify' badge with a tooltip explaining why, when needsReview is true", () => {
    renderCard({ needsReview: true });
    expect(screen.getByText("Verify")).toBeInTheDocument();
    expect(screen.getByRole("tooltip")).toHaveTextContent(LOW_CONFIDENCE_TOOLTIP);
  });

  it("shows the handwriting-mismatch tooltip when reviewTooltip overrides the default", () => {
    renderCard({ needsReview: true, reviewTooltip: HANDWRITING_MISMATCH_TOOLTIP });
    expect(screen.getByText("Verify")).toBeInTheDocument();
    expect(screen.getByRole("tooltip")).toHaveTextContent(HANDWRITING_MISMATCH_TOOLTIP);
  });
});
