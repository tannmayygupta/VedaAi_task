import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { UploadSlotCard } from "./UploadSlotCard";

const { normalizeSlotFilesMock } = vi.hoisted(() => ({ normalizeSlotFilesMock: vi.fn() }));

vi.mock("@/lib/upload/normalizeSlotFiles", () => ({
  normalizeSlotFiles: normalizeSlotFilesMock,
}));

function makeFile(name: string, type: string) {
  return new File(["content"], name, { type });
}

describe("UploadSlotCard", () => {
  it("shows the dropzone when no file is selected", () => {
    normalizeSlotFilesMock.mockResolvedValue({ totalPages: 1 });
    render(
      <UploadSlotCard
        label="Upload Question Paper"
        accentLabel="Question Paper"
        slotState={{ files: [], error: null }}
        onFilesSelected={() => {}}
        onRemove={() => {}}
      />,
    );
    expect(screen.getByText(/Question Paper/)).toBeInTheDocument();
  });

  it("shows a 'couldn't read this file' error when page-count parsing fails on an accepted file", async () => {
    normalizeSlotFilesMock.mockRejectedValueOnce(new Error("Invalid PDF structure"));
    render(
      <UploadSlotCard
        label="Upload Question Paper"
        accentLabel="Question Paper"
        slotState={{ files: [makeFile("paper.pdf", "application/pdf")], error: null }}
        onFilesSelected={() => {}}
        onRemove={() => {}}
      />,
    );

    expect(await screen.findByText(/couldn't read this file/i)).toBeInTheDocument();
    // The file chip still renders — the file was accepted by validation, just
    // unreadable for page-count purposes — the user can still remove it.
    expect(screen.getByRole("button", { name: /remove file/i })).toBeInTheDocument();
  });

  it("clears the unreadable-file error once a new, readable file is selected", async () => {
    normalizeSlotFilesMock.mockRejectedValueOnce(new Error("boom"));
    const { rerender } = render(
      <UploadSlotCard
        label="Upload Question Paper"
        accentLabel="Question Paper"
        slotState={{ files: [makeFile("bad.pdf", "application/pdf")], error: null }}
        onFilesSelected={() => {}}
        onRemove={() => {}}
      />,
    );
    expect(await screen.findByText(/couldn't read this file/i)).toBeInTheDocument();

    normalizeSlotFilesMock.mockResolvedValueOnce({ totalPages: 2 });
    rerender(
      <UploadSlotCard
        label="Upload Question Paper"
        accentLabel="Question Paper"
        slotState={{ files: [makeFile("good.pdf", "application/pdf")], error: null }}
        onFilesSelected={() => {}}
        onRemove={() => {}}
      />,
    );

    await waitFor(() =>
      expect(screen.queryByText(/couldn't read this file/i)).not.toBeInTheDocument(),
    );
  });

  it("shows the validation error message from slotState alongside the dropzone", () => {
    render(
      <UploadSlotCard
        label="Upload Question Paper"
        accentLabel="Question Paper"
        slotState={{ files: [], error: "too-large" }}
        onFilesSelected={() => {}}
        onRemove={() => {}}
      />,
    );
    expect(screen.getByText(/max 10mb per file/i)).toBeInTheDocument();
  });
});
