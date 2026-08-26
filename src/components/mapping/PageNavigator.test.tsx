import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PageNavigator } from "./PageNavigator";

describe("PageNavigator", () => {
  it("renders the 1-indexed page label", () => {
    render(
      <PageNavigator currentPageIndex={0} totalPages={4} onPrevPage={vi.fn()} onNextPage={vi.fn()} />,
    );
    expect(screen.getByText("Page 1 of 4")).toBeInTheDocument();
  });

  it("calls onNextPage when the next button is clicked", async () => {
    const onNextPage = vi.fn();
    render(
      <PageNavigator currentPageIndex={0} totalPages={4} onPrevPage={vi.fn()} onNextPage={onNextPage} />,
    );
    await userEvent.click(screen.getByRole("button", { name: /next page/i }));
    expect(onNextPage).toHaveBeenCalledTimes(1);
  });

  it("calls onPrevPage when the previous button is clicked", async () => {
    const onPrevPage = vi.fn();
    render(
      <PageNavigator currentPageIndex={1} totalPages={4} onPrevPage={onPrevPage} onNextPage={vi.fn()} />,
    );
    await userEvent.click(screen.getByRole("button", { name: /previous page/i }));
    expect(onPrevPage).toHaveBeenCalledTimes(1);
  });

  it("disables the previous button on the first page and does not call the handler", async () => {
    const onPrevPage = vi.fn();
    render(
      <PageNavigator currentPageIndex={0} totalPages={4} onPrevPage={onPrevPage} onNextPage={vi.fn()} />,
    );
    const button = screen.getByRole("button", { name: /previous page/i });
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onPrevPage).not.toHaveBeenCalled();
  });

  it("disables the next button on the last page and does not call the handler", async () => {
    const onNextPage = vi.fn();
    render(
      <PageNavigator currentPageIndex={3} totalPages={4} onPrevPage={vi.fn()} onNextPage={onNextPage} />,
    );
    const button = screen.getByRole("button", { name: /next page/i });
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onNextPage).not.toHaveBeenCalled();
  });
});
