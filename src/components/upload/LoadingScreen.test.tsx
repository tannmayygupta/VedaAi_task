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
});
