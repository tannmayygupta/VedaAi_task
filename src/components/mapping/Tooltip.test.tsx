import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Tooltip } from "./Tooltip";

describe("Tooltip", () => {
  it("renders its trigger content and the tooltip label", () => {
    render(
      <Tooltip label="Extra detail on hover">
        <button type="button">Verify</button>
      </Tooltip>,
    );

    expect(screen.getByRole("button", { name: "Verify" })).toBeInTheDocument();
    expect(screen.getByRole("tooltip")).toHaveTextContent("Extra detail on hover");
  });
});
