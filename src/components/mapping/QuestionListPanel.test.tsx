import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuestionListPanel } from "./QuestionListPanel";
import type { Question } from "@/lib/schemas/question";
import type { Grading } from "@/lib/schemas/grading";
import type { AnswerRegion } from "@/lib/schemas/answerRegion";

const questions: Question[] = [
  {
    id: "q1",
    number: "1",
    subpart: null,
    displayLabel: "1",
    text: "What is the capital of France?",
    marksTotal: 2,
    pageIndex: 0,
    order: 0,
  },
  {
    id: "q2",
    number: "2",
    subpart: null,
    displayLabel: "2",
    text: "Name a river in Egypt.",
    marksTotal: 2,
    pageIndex: 0,
    order: 1,
  },
];

const gradings: Grading[] = [
  { questionId: "q1", marksAwarded: 2, marksTotal: 2, correctness: "correct", feedback: "Correct!" },
  { questionId: "q2", marksAwarded: 0, marksTotal: 2, correctness: "unanswered", feedback: "No answer provided." },
];

const regions: AnswerRegion[] = [];

describe("QuestionListPanel", () => {
  it("renders every question's text", () => {
    render(
      <QuestionListPanel
        questions={questions}
        gradings={gradings}
        regions={regions}
        selectedQuestionId={null}
        onSelectQuestion={vi.fn()}
      />,
    );
    expect(screen.getByText("What is the capital of France?")).toBeInTheDocument();
    expect(screen.getByText("Name a river in Egypt.")).toBeInTheDocument();
  });

  it("shows the correct score labels", () => {
    render(
      <QuestionListPanel
        questions={questions}
        gradings={gradings}
        regions={regions}
        selectedQuestionId={null}
        onSelectQuestion={vi.fn()}
      />,
    );
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
    expect(screen.getByText("Unanswered")).toBeInTheDocument();
  });

  it("calls onSelectQuestion when a card is clicked (via its chevron toggle)", async () => {
    const onSelectQuestion = vi.fn();
    render(
      <QuestionListPanel
        questions={questions}
        gradings={gradings}
        regions={regions}
        selectedQuestionId={null}
        onSelectQuestion={onSelectQuestion}
      />,
    );
    const toggles = screen.getAllByRole("button", { name: /toggle question details/i });
    await userEvent.click(toggles[0]);
    expect(onSelectQuestion).toHaveBeenCalledWith("q1");
  });

  it("expands all cards on Expand All and collapses them again on Collapse All", async () => {
    render(
      <QuestionListPanel
        questions={questions}
        gradings={gradings}
        regions={regions}
        selectedQuestionId={null}
        onSelectQuestion={vi.fn()}
      />,
    );
    expect(screen.queryByText("Correct!")).not.toBeInTheDocument();

    await userEvent.click(screen.getByText("Expand All"));
    expect(screen.getByText("Correct!")).toBeInTheDocument();
    expect(screen.getByText("No answer provided.")).toBeInTheDocument();

    await userEvent.click(screen.getByText("Collapse All"));
    expect(screen.queryByText("Correct!")).not.toBeInTheDocument();
  });
});
