import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "./page";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/lib/upload/uploadFileToBlob", () => ({
  uploadFileToBlob: vi.fn(async (file: File) => ({
    url: `https://blob.example/${file.name}`,
    pathname: file.name,
  })),
}));

vi.mock("@/lib/upload/mergeFilesToPdf", () => ({
  mergeFilesToPdf: vi.fn(async () => new File(["merged"], "merged.pdf", { type: "application/pdf" })),
}));

// This screen's page-count chip (via normalizeSlotFiles) calls into real
// pdfjs-dist for PDF files, which needs a real worker/canvas environment
// jsdom doesn't provide — irrelevant to what these tests actually check, so
// stub a page count instead of exercising the real PDF parser.
vi.mock("@/lib/pdf/pdfjs", () => ({
  getPdfDocument: vi.fn(async () => ({ numPages: 1 })),
}));

function makeFile(name: string, type: string) {
  return new File(["content"], name, { type });
}

describe("Home (upload screen)", () => {
  beforeEach(() => {
    pushMock.mockClear();
  });

  it("disables Start Mapping until both files are selected, then enables it", async () => {
    render(<Home />);
    const button = screen.getByRole("button", { name: /start mapping/i });
    expect(button).toBeDisabled();

    const inputs = document.querySelectorAll('input[type="file"]');
    await userEvent.upload(inputs[0] as HTMLInputElement, makeFile("qp.pdf", "application/pdf"));
    expect(button).toBeDisabled();

    await userEvent.upload(inputs[1] as HTMLInputElement, makeFile("as.pdf", "application/pdf"));
    expect(button).not.toBeDisabled();
  });

  it("uploads both files to Blob and navigates to /mapping on Start Mapping", async () => {
    render(<Home />);
    const inputs = document.querySelectorAll('input[type="file"]');
    await userEvent.upload(inputs[0] as HTMLInputElement, makeFile("qp.pdf", "application/pdf"));
    await userEvent.upload(inputs[1] as HTMLInputElement, makeFile("as.pdf", "application/pdf"));

    await userEvent.click(screen.getByRole("button", { name: /start mapping/i }));

    expect(screen.getByText(/uploading…/i)).toBeInTheDocument();

    await waitFor(() => expect(pushMock).toHaveBeenCalledTimes(1));
    const [pushedUrl] = pushMock.mock.calls[0];
    expect(pushedUrl).toContain("/mapping?");
    expect(pushedUrl).toContain("qp.pdf");
    expect(pushedUrl).toContain("as.pdf");
  });

  it("shows real upload progress (averaged across both slots) while uploading", async () => {
    const { uploadFileToBlob } = await import("@/lib/upload/uploadFileToBlob");
    vi.mocked(uploadFileToBlob).mockImplementation(async (file, onProgress) => {
      onProgress?.(file.name === "qp.pdf" ? 100 : 50);
      return new Promise(() => {}); // never resolves — hold on the loading screen to inspect it
    });

    render(<Home />);
    const inputs = document.querySelectorAll('input[type="file"]');
    await userEvent.upload(inputs[0] as HTMLInputElement, makeFile("qp.pdf", "application/pdf"));
    await userEvent.upload(inputs[1] as HTMLInputElement, makeFile("as.pdf", "application/pdf"));
    await userEvent.click(screen.getByRole("button", { name: /start mapping/i }));

    // (100 + 50) / 2 = 75
    expect(await screen.findByText("Uploading… 75%")).toBeInTheDocument();

    // Restore the default (resolving) mock so later tests in this file aren't
    // left hanging on the never-resolving implementation set above.
    vi.mocked(uploadFileToBlob).mockImplementation(async (file: File) => ({
      url: `https://blob.example/${file.name}`,
      pathname: file.name,
    }));
  });

  it("merges multiple selected files for a slot into one PDF before uploading, then navigates with a single URL per slot", async () => {
    const { mergeFilesToPdf } = await import("@/lib/upload/mergeFilesToPdf");
    const { uploadFileToBlob } = await import("@/lib/upload/uploadFileToBlob");

    render(<Home />);
    const inputs = document.querySelectorAll('input[type="file"]');
    await userEvent.upload(inputs[0] as HTMLInputElement, makeFile("qp.pdf", "application/pdf"));
    await userEvent.upload(inputs[1] as HTMLInputElement, [
      makeFile("as-page1.jpg", "image/jpeg"),
      makeFile("as-page2.jpg", "image/jpeg"),
    ]);

    await userEvent.click(screen.getByRole("button", { name: /start mapping/i }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledTimes(1));

    expect(mergeFilesToPdf).toHaveBeenCalledTimes(1);
    const mergedFiles = vi.mocked(mergeFilesToPdf).mock.calls[0][0];
    expect(mergedFiles.map((f) => f.name)).toEqual(["as-page1.jpg", "as-page2.jpg"]);

    // The question paper slot had only one file, so it must upload directly
    // without going through the merge step.
    expect(vi.mocked(uploadFileToBlob).mock.calls.some(([f]) => f.name === "qp.pdf")).toBe(true);

    const [pushedUrl] = pushMock.mock.calls[0];
    const params = new URLSearchParams(pushedUrl.split("?")[1]);
    expect(params.get("answerSheet")).toBe("https://blob.example/merged.pdf");
    expect(params.get("answerSheet")).not.toContain(",");
  });

  it("shows an error and returns to the upload view if a Blob upload fails", async () => {
    const { uploadFileToBlob } = await import("@/lib/upload/uploadFileToBlob");
    vi.mocked(uploadFileToBlob).mockRejectedValueOnce(new Error("network error"));

    render(<Home />);
    const inputs = document.querySelectorAll('input[type="file"]');
    await userEvent.upload(inputs[0] as HTMLInputElement, makeFile("qp.pdf", "application/pdf"));
    await userEvent.upload(inputs[1] as HTMLInputElement, makeFile("as.pdf", "application/pdf"));
    await userEvent.click(screen.getByRole("button", { name: /start mapping/i }));

    await waitFor(() => expect(screen.getByText(/upload failed/i)).toBeInTheDocument());
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("shows a validation error and does not enable Start Mapping for an unsupported file type", async () => {
    // The native file input's `accept` attribute means a real OS picker (and
    // @testing-library/user-event's upload()) would never offer a mismatched
    // file — drag-and-drop is the realistic path for an invalid type to reach
    // onFilesSelected, so we simulate a drop here instead of userEvent.upload.
    render(<Home />);
    const inputs = document.querySelectorAll('input[type="file"]');
    const dropzone = inputs[0].closest('[role="button"]') as HTMLElement;
    const file = makeFile("virus.exe", "application/x-msdownload");
    const dataTransfer = { files: [file] } as unknown as DataTransfer;
    dropzone.dispatchEvent(
      Object.assign(new Event("drop", { bubbles: true, cancelable: true }), { dataTransfer }),
    );

    expect(await screen.findByText(/unsupported file type/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start mapping/i })).toBeDisabled();
  });
});
