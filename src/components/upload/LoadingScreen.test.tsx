import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoadingScreen } from "./LoadingScreen";

describe("LoadingScreen", () => {
  it("renders the default message and the fixed subtext", () => {
    render(<LoadingScreen />);
    expect(screen.getByText("Extracting…")).toBeInTheDocument();
    expect(screen.getByText("This may take a while")).toBeInTheDocument();
  });

  it("renders a custom message while keeping the fixed subtext", () => {
    render(<LoadingScreen message="Uploading…" />);
    expect(screen.getByText("Uploading…")).toBeInTheDocument();
    expect(screen.getByText("This may take a while")).toBeInTheDocument();
  });

  it("shows a real progress percentage and bar instead of the static subtext when provided", () => {
    render(<LoadingScreen message="Uploading…" progressPercent={42} />);
    expect(screen.getByText("Uploading… 42%")).toBeInTheDocument();
    expect(screen.queryByText("This may take a while")).not.toBeInTheDocument();
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "42");
  });

  it("rounds a fractional progress percentage", () => {
    render(<LoadingScreen message="Uploading…" progressPercent={42.7} />);
    expect(screen.getByText("Uploading… 43%")).toBeInTheDocument();
  });
});
