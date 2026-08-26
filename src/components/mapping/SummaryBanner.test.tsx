import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SummaryBanner } from "./SummaryBanner";
import { formatMappingSummary, type MappingSummary } from "@/lib/mapping/mappingSummary";

const summary: MappingSummary = {
  totalAwarded: 18,
  totalPossible: 25,
  percentage: 72,
  unansweredCount: 2,
  unmatchedRegionCount: 1,
  totalQuestionCount: 9,
};

describe("SummaryBanner", () => {
  it("renders the formatted summary line", () => {
    render(<SummaryBanner summary={summary} allExpanded={false} onToggleExpandAll={vi.fn()} />);
    expect(screen.getByText(formatMappingSummary(summary))).toBeInTheDocument();
  });

  it("shows Expand All when not expanded", () => {
    render(<SummaryBanner summary={summary} allExpanded={false} onToggleExpandAll={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Expand All" })).toBeInTheDocument();
  });

  it("shows Collapse All when expanded", () => {
    render(<SummaryBanner summary={summary} allExpanded={true} onToggleExpandAll={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Collapse All" })).toBeInTheDocument();
  });

  it("calls onToggleExpandAll when clicked", async () => {
    const onToggleExpandAll = vi.fn();
    render(
      <SummaryBanner summary={summary} allExpanded={false} onToggleExpandAll={onToggleExpandAll} />,
    );
    await userEvent.click(screen.getByRole("button"));
    expect(onToggleExpandAll).toHaveBeenCalledTimes(1);
  });
});
