import { describe, expect, it, vi, beforeEach } from "vitest";
import { upload } from "@vercel/blob/client";
import { uploadFileToBlob, BLOB_UPLOAD_TOKEN_ROUTE } from "./uploadFileToBlob";

vi.mock("@vercel/blob/client", () => ({
  upload: vi.fn(),
}));

const mockedUpload = vi.mocked(upload);

function makeFile(name = "answer-sheet.pdf") {
  return new File(["dummy content"], name, { type: "application/pdf" });
}

describe("uploadFileToBlob", () => {
  beforeEach(() => {
    mockedUpload.mockReset();
  });

  it("calls upload() with the file's name, the file itself, and the correct options", async () => {
    const file = makeFile();
    mockedUpload.mockResolvedValue({
      url: "https://blob.example/answer-sheet.pdf",
      pathname: "answer-sheet.pdf",
      contentType: "application/pdf",
      contentDisposition: "inline",
      downloadUrl: "https://blob.example/answer-sheet.pdf?download=1",
      etag: "etag-1",
    });

    await uploadFileToBlob(file);

    expect(mockedUpload).toHaveBeenCalledTimes(1);
    const [pathname, body, options] = mockedUpload.mock.calls[0];
    expect(pathname).toBe(file.name);
    expect(body).toBe(file);
    expect(options).toMatchObject({
      access: "public",
      handleUploadUrl: BLOB_UPLOAD_TOKEN_ROUTE,
    });
  });

  it("resolves to { url, pathname } taken from the upload() result", async () => {
    mockedUpload.mockResolvedValue({
      url: "https://blob.example/question-paper.pdf",
      pathname: "question-paper.pdf",
      contentType: "application/pdf",
      contentDisposition: "inline",
      downloadUrl: "https://blob.example/question-paper.pdf?download=1",
      etag: "etag-2",
    });

    const result = await uploadFileToBlob(makeFile("question-paper.pdf"));

    expect(result).toEqual({
      url: "https://blob.example/question-paper.pdf",
      pathname: "question-paper.pdf",
    });
  });

  it("wires onProgress through to onUploadProgress", async () => {
    mockedUpload.mockImplementation(async (_pathname, _body, options) => {
      options.onUploadProgress?.({ loaded: 50, total: 100, percentage: 50 });
      return {
        url: "https://blob.example/f.pdf",
        pathname: "f.pdf",
        contentType: "application/pdf",
        contentDisposition: "inline",
        downloadUrl: "https://blob.example/f.pdf?download=1",
        etag: "etag-3",
      };
    });

    const onProgress = vi.fn();
    await uploadFileToBlob(makeFile(), onProgress);

    expect(onProgress).toHaveBeenCalledWith(50);
  });

  it("propagates errors from upload() instead of swallowing them", async () => {
    mockedUpload.mockRejectedValue(new Error("network failure"));

    await expect(uploadFileToBlob(makeFile())).rejects.toThrow("network failure");
  });
});
