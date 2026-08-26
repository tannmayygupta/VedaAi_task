import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import type { PDFPageProxy } from "pdfjs-dist";
import { PdfPageCanvas } from "./PdfPageCanvas";

// A real PDFPageProxy has dozens of internal fields we don't need for these
// tests — cast the minimal fake through `unknown` rather than modeling them.
function makeFakePage(renderPromise: Promise<void> = Promise.resolve()) {
  const cancel = vi.fn();
  const page = {
    getViewport: vi.fn(({ scale }: { scale: number }) => ({ width: 100 * scale, height: 140 * scale })),
    render: vi.fn(() => ({ promise: renderPromise, cancel })),
    cancel,
  };
  return page as unknown as PDFPageProxy & typeof page;
}

describe("PdfPageCanvas", () => {
  it("sizes the canvas from the viewport and renders the requested page", async () => {
    const fakePage = makeFakePage();
    const getPage = vi.fn(async () => fakePage);

    const { container } = render(<PdfPageCanvas getPage={getPage} pageNumber={2} scale={2} />);

    await waitFor(() => expect(getPage).toHaveBeenCalledWith(2));
    expect(fakePage.getViewport).toHaveBeenCalledWith({ scale: 2 });

    const canvas = container.querySelector("canvas");
    expect(canvas).not.toBeNull();
    await waitFor(() => {
      expect(canvas?.width).toBe(200);
      expect(canvas?.height).toBe(280);
    });
    expect(fakePage.render).toHaveBeenCalledTimes(1);
  });

  it("shows an error message when rendering fails", async () => {
    const getPage = vi.fn(async () => {
      throw new Error("boom");
    });

    render(<PdfPageCanvas getPage={getPage} pageNumber={1} scale={1} />);

    expect(await screen.findByText(/couldn't render this page/i)).toBeInTheDocument();
  });

  it("cancels the in-flight render task when the page number changes before it finishes", async () => {
    let resolveRender: () => void = () => {};
    const pendingRender = new Promise<void>((resolve) => {
      resolveRender = resolve;
    });
    const firstPage = makeFakePage(pendingRender);
    const secondPage = makeFakePage();
    const getPage = vi.fn(async (pageNumber: number) => (pageNumber === 1 ? firstPage : secondPage));

    const { rerender } = render(<PdfPageCanvas getPage={getPage} pageNumber={1} scale={1} />);
    await waitFor(() => expect(getPage).toHaveBeenCalledWith(1));

    rerender(<PdfPageCanvas getPage={getPage} pageNumber={2} scale={1} />);
    await waitFor(() => expect(getPage).toHaveBeenCalledWith(2));

    expect(firstPage.cancel).toHaveBeenCalled();
    resolveRender();
  });
});
