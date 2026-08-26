import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { QuestionListDebugView } from "./QuestionListDebugView";
import type { Question } from "@/lib/schemas/question";

const sampleQuestions: Question[] = [
  {
    id: "q1",
    number: "1",
    subpart: null,
    displayLabel: "1",
    text: "What is the powerhouse of the cell?",
    marksTotal: null,
    pageIndex: 0,
    order: 0,
  },
  {
    id: "q2",
    number: "2",
    subpart: null,
    displayLabel: "2",
    text: "Define Newton's second law of motion.",
    marksTotal: 2,
    pageIndex: 0,
    order: 1,
  },
  {
    id: "q3-a",
    number: "3",
    subpart: "a",
    displayLabel: "3 (a)",
    text: "Identify which chemical is more reactive.",
    marksTotal: 2,
    pageIndex: 0,
    order: 2,
  },
];

describe("QuestionListDebugView", () => {
  it("renders every question's text", () => {
    render(<QuestionListDebugView questions={sampleQuestions} />);
    expect(screen.getByText(/What is the powerhouse of the cell\?/)).toBeInTheDocument();
    expect(screen.getByText(/Define Newton's second law of motion\./)).toBeInTheDocument();
    expect(screen.getByText(/Identify which chemical is more reactive\./)).toBeInTheDocument();
  });

  it("shows a clear indicator for a null marksTotal instead of blank", () => {
    render(<QuestionListDebugView questions={sampleQuestions} />);
    expect(screen.getByText(/no marks stated/i)).toBeInTheDocument();
  });

  it("shows stated marks for a question with a marksTotal", () => {
    render(<QuestionListDebugView questions={sampleQuestions} />);
    expect(screen.getAllByText(/2 marks/).length).toBeGreaterThan(0);
  });

  it("renders a clear empty-state message when there are no questions", () => {
    render(<QuestionListDebugView questions={[]} />);
    expect(screen.getByText(/no questions extracted/i)).toBeInTheDocument();
  });
});
