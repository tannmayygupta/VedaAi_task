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

function renderBanner(overrides: Partial<Parameters<typeof SummaryBanner>[0]> = {}) {
  const onToggleExpandAll = vi.fn();
  const onExportJson = vi.fn();
  render(
    <SummaryBanner
      summary={summary}
      allExpanded={false}
      onToggleExpandAll={onToggleExpandAll}
      onExportJson={onExportJson}
      {...overrides}
    />,
  );
  return { onToggleExpandAll, onExportJson };
}

describe("SummaryBanner", () => {
  it("renders the formatted summary line", () => {
    renderBanner();
    expect(screen.getByText(formatMappingSummary(summary))).toBeInTheDocument();
  });

  it("shows Expand All when not expanded", () => {
    renderBanner({ allExpanded: false });
    expect(screen.getByRole("button", { name: "Expand All" })).toBeInTheDocument();
  });

  it("shows Collapse All when expanded", () => {
    renderBanner({ allExpanded: true });
    expect(screen.getByRole("button", { name: "Collapse All" })).toBeInTheDocument();
  });

  it("calls onToggleExpandAll when the expand/collapse button is clicked", async () => {
    const { onToggleExpandAll } = renderBanner();
    await userEvent.click(screen.getByRole("button", { name: "Expand All" }));
    expect(onToggleExpandAll).toHaveBeenCalledTimes(1);
  });

  it("renders an Export JSON button and calls onExportJson when clicked", async () => {
    const { onExportJson } = renderBanner();
    const exportButton = screen.getByRole("button", { name: /export as json/i });
    expect(exportButton).toBeInTheDocument();
    await userEvent.click(exportButton);
    expect(onExportJson).toHaveBeenCalledTimes(1);
  });
});
