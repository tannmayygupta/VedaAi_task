"use client";

import type { Question } from "@/lib/schemas/question";

export type QuestionListDebugViewProps = {
  questions: Question[];
};

export function QuestionListDebugView({ questions }: QuestionListDebugViewProps) {
  if (questions.length === 0) {
    return <p>No questions extracted</p>;
  }

  return (
    <ol>
      {questions.map((question) => (
        <li key={question.id}>
          <strong>{question.displayLabel}</strong> ({question.marksTotal === null ? "no marks stated" : `${question.marksTotal} marks`}): {question.text}
        </li>
      ))}
    </ol>
  );
}
