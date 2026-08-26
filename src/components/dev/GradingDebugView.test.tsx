import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { GradingDebugView } from "./GradingDebugView";
import type { Grading } from "@/lib/schemas/grading";

const sampleGradings: Grading[] = [
  {
    questionId: "q1",
    marksAwarded: 2,
    marksTotal: 2,
    correctness: "correct",
    feedback: "Great job identifying Jupiter as the largest planet.",
  },
  {
    questionId: "q2",
    marksAwarded: 0,
    marksTotal: 2,
    correctness: "unanswered",
    feedback: "No answer was provided for this question.",
  },
  {
    questionId: "q3",
    marksAwarded: 1,
    marksTotal: 3,
    correctness: "partial",
    feedback: "You listed some continents but missed a few.",
  },
];

describe("GradingDebugView", () => {
  it("renders each grading's feedback and marks fraction", () => {
    render(<GradingDebugView gradings={sampleGradings} />);
    expect(
      screen.getByText("Great job identifying Jupiter as the largest planet."),
    ).toBeInTheDocument();
    expect(screen.getByText("2/2")).toBeInTheDocument();
    expect(screen.getByText("0/2")).toBeInTheDocument();
    expect(screen.getByText("1/3")).toBeInTheDocument();
  });

  it("renders the summary line when provided", () => {
    render(<GradingDebugView gradings={sampleGradings} summaryLine="18/25 (72%)" />);
    expect(screen.getByText("18/25 (72%)")).toBeInTheDocument();
  });

  it("does not render a summary line when omitted", () => {
    render(<GradingDebugView gradings={sampleGradings} />);
    expect(screen.queryByText(/%\)/)).not.toBeInTheDocument();
  });

  it("renders a 'No gradings yet' message for an empty list", () => {
    render(<GradingDebugView gradings={[]} />);
    expect(screen.getByText("No gradings yet")).toBeInTheDocument();
  });
});
