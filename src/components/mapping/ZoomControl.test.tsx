import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ZoomControl } from "./ZoomControl";

describe("ZoomControl", () => {
  it("renders the zoom percentage", () => {
    render(<ZoomControl zoomPercent={100} onZoomOut={vi.fn()} onZoomIn={vi.fn()} />);
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("calls onZoomIn when the zoom-in button is clicked", async () => {
    const onZoomIn = vi.fn();
    render(<ZoomControl zoomPercent={100} onZoomOut={vi.fn()} onZoomIn={onZoomIn} />);
    await userEvent.click(screen.getByRole("button", { name: /zoom in/i }));
    expect(onZoomIn).toHaveBeenCalledTimes(1);
  });

  it("calls onZoomOut when the zoom-out button is clicked", async () => {
    const onZoomOut = vi.fn();
    render(<ZoomControl zoomPercent={100} onZoomOut={onZoomOut} onZoomIn={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /zoom out/i }));
    expect(onZoomOut).toHaveBeenCalledTimes(1);
  });

  it("disables zoom-out at the min and does not call the handler", async () => {
    const onZoomOut = vi.fn();
    render(<ZoomControl zoomPercent={50} onZoomOut={onZoomOut} onZoomIn={vi.fn()} min={50} />);
    const button = screen.getByRole("button", { name: /zoom out/i });
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onZoomOut).not.toHaveBeenCalled();
  });

  it("disables zoom-in at the max and does not call the handler", async () => {
    const onZoomIn = vi.fn();
    render(<ZoomControl zoomPercent={200} onZoomOut={vi.fn()} onZoomIn={onZoomIn} max={200} />);
    const button = screen.getByRole("button", { name: /zoom in/i });
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onZoomIn).not.toHaveBeenCalled();
  });
});
