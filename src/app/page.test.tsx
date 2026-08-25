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

    expect(screen.getByText("Uploading…")).toBeInTheDocument();

    await waitFor(() => expect(pushMock).toHaveBeenCalledTimes(1));
    const [pushedUrl] = pushMock.mock.calls[0];
    expect(pushedUrl).toContain("/mapping?");
    expect(pushedUrl).toContain("qp.pdf");
    expect(pushedUrl).toContain("as.pdf");
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
