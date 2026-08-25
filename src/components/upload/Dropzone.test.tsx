import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dropzone } from "./Dropzone";

function makeFile(name: string, type: string) {
  return new File(["content"], name, { type });
}

describe("Dropzone", () => {
  it("renders the label and max-size caption", () => {
    render(
      <Dropzone label="Question Paper" accentLabel="Question Paper" onFilesSelected={vi.fn()} />
    );
    expect(screen.getByText("Question Paper")).toBeInTheDocument();
    expect(screen.getByText("Max 10MB")).toBeInTheDocument();
  });

  it("calls onFilesSelected when a file is chosen via the input", async () => {
    const onFilesSelected = vi.fn();
    render(<Dropzone label="Answer Sheet" accentLabel="Answer Sheet" onFilesSelected={onFilesSelected} />);

    const file = makeFile("sheet.pdf", "application/pdf");
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    await userEvent.upload(input, file);

    expect(onFilesSelected).toHaveBeenCalledTimes(1);
    expect(onFilesSelected).toHaveBeenCalledWith([file]);
  });

  it("calls onFilesSelected when a file is dropped", () => {
    const onFilesSelected = vi.fn();
    render(<Dropzone label="Answer Sheet" accentLabel="Answer Sheet" onFilesSelected={onFilesSelected} />);

    const file = makeFile("dropped.png", "image/png");
    const dropzone = screen.getByRole("button");

    const dataTransfer = { files: [file] } as unknown as DataTransfer;
    dropzone.dispatchEvent(
      Object.assign(new Event("drop", { bubbles: true, cancelable: true }), { dataTransfer })
    );

    expect(onFilesSelected).toHaveBeenCalledTimes(1);
    expect(onFilesSelected).toHaveBeenCalledWith([file]);
  });
});
