import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchBlobFile } from "./fetchBlobFile";

function makeHeaders(contentType: string | null) {
  return { get: (name: string) => (name.toLowerCase() === "content-type" ? contentType : null) };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchBlobFile", () => {
  it("resolves bytes, mimeType, and sizeBytes for a successful response", async () => {
    const buffer = new TextEncoder().encode("hello world").buffer;
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: makeHeaders("application/pdf"),
      arrayBuffer: () => Promise.resolve(buffer),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchBlobFile("https://blob.example/file.pdf");

    expect(result.bytes).toBe(buffer);
    expect(result.mimeType).toBe("application/pdf");
    expect(result.sizeBytes).toBe(buffer.byteLength);
    expect(fetchMock).toHaveBeenCalledWith("https://blob.example/file.pdf");
  });

  it("falls back to application/octet-stream when content-type is missing", async () => {
    const buffer = new ArrayBuffer(4);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        headers: makeHeaders(null),
        arrayBuffer: () => Promise.resolve(buffer),
      }),
    );

    const result = await fetchBlobFile("https://blob.example/file.bin");

    expect(result.mimeType).toBe("application/octet-stream");
  });

  it("rejects with an error mentioning the status code on a non-OK response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
        headers: makeHeaders(null),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      }),
    );

    await expect(fetchBlobFile("https://blob.example/missing.pdf")).rejects.toThrow(/404/);
  });
});
