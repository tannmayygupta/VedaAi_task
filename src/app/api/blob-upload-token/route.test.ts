import { describe, expect, it, vi } from "vitest";

vi.mock("@vercel/blob/client", () => ({
  handleUpload: vi.fn(),
}));

import { handleUpload } from "@vercel/blob/client";
import { POST } from "./route";

const mockedHandleUpload = vi.mocked(handleUpload);

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/blob-upload-token", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/blob-upload-token", () => {
  it("returns 200 with the resolved payload when handleUpload succeeds", async () => {
    mockedHandleUpload.mockResolvedValueOnce({
      type: "blob.generate-client-token",
      clientToken: "fake-token",
    });

    const response = await POST(makeRequest({ type: "blob.generate-client-token" }));

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toEqual({ type: "blob.generate-client-token", clientToken: "fake-token" });
  });

  it("returns 400 with an error field when handleUpload throws", async () => {
    mockedHandleUpload.mockRejectedValueOnce(new Error("invalid token payload"));

    const response = await POST(makeRequest({ type: "blob.generate-client-token" }));

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json).toEqual({ error: "invalid token payload" });
  });
});
