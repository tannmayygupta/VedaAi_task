import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchBlobFile, isAllowedBlobUrl } from "./fetchBlobFile";

const VALID_BLOB_URL = "https://abc123def456.public.blob.vercel-storage.com/file.pdf";

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

    const result = await fetchBlobFile(VALID_BLOB_URL);

    expect(result.bytes).toBe(buffer);
    expect(result.mimeType).toBe("application/pdf");
    expect(result.sizeBytes).toBe(buffer.byteLength);
    expect(fetchMock).toHaveBeenCalledWith(VALID_BLOB_URL);
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

    const result = await fetchBlobFile(VALID_BLOB_URL);

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

    await expect(fetchBlobFile(VALID_BLOB_URL)).rejects.toThrow(/404/);
  });

  it("rejects a URL outside the Vercel Blob store without calling fetch", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchBlobFile("https://evil.example/internal-secret")).rejects.toThrow(
      /Refusing to fetch/,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("isAllowedBlobUrl", () => {
  it("accepts an https URL on the Vercel Blob public storage domain", () => {
    expect(isAllowedBlobUrl(VALID_BLOB_URL)).toBe(true);
  });

  it("rejects a non-Blob-storage host", () => {
    expect(isAllowedBlobUrl("https://evil.example/file.pdf")).toBe(false);
  });

  it("rejects http (non-https)", () => {
    expect(isAllowedBlobUrl("http://abc123.public.blob.vercel-storage.com/file.pdf")).toBe(false);
  });

  it("rejects a malformed URL", () => {
    expect(isAllowedBlobUrl("not-a-url")).toBe(false);
  });

  it("rejects a lookalike host that merely ends with the suffix as a prefix trick", () => {
    expect(isAllowedBlobUrl("https://public.blob.vercel-storage.com.evil.example/file.pdf")).toBe(
      false,
    );
  });
});
