import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { NoAnswerFoundState } from "./NoAnswerFoundState";

describe("NoAnswerFoundState", () => {
  it("renders a message that includes the given question label", () => {
    render(<NoAnswerFoundState questionLabel="Question 5 (c)" />);
    expect(screen.getByText(/No answer found for Question 5 \(c\)/i)).toBeInTheDocument();
  });

  it("renders the secondary explanatory line", () => {
    render(<NoAnswerFoundState questionLabel="Question 2" />);
    expect(
      screen.getByText(/doesn't appear to have been answered on the sheet/i),
    ).toBeInTheDocument();
  });
});
