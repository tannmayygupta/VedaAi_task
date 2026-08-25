import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FileChip } from "./FileChip";

describe("FileChip", () => {
  it("renders the filename, size label, and pluralized page count", () => {
    render(
      <FileChip
        fileName="Class_10_maths_unit_test.pdf"
        fileSizeLabel="2MB"
        pageCount={2}
        onRemove={() => {}}
      />
    );

    expect(screen.getByText("Class_10_maths_unit_test.pdf")).toBeInTheDocument();
    expect(screen.getByText(/2MB/)).toBeInTheDocument();
    expect(screen.getByText(/2 Pages/)).toBeInTheDocument();
  });

  it("renders singular 'Page' when pageCount is 1", () => {
    render(
      <FileChip fileName="answer.pdf" fileSizeLabel="1MB" pageCount={1} onRemove={() => {}} />
    );

    expect(screen.getByText(/1 Page(?!s)/)).toBeInTheDocument();
  });

  it("calls onRemove exactly once when the remove button is clicked", async () => {
    const onRemove = vi.fn();
    const user = userEvent.setup();

    render(
      <FileChip fileName="answer.pdf" fileSizeLabel="1MB" pageCount={1} onRemove={onRemove} />
    );

    await user.click(screen.getByRole("button", { name: /remove/i }));

    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});
