"use client";

import { useEffect, useRef, useState } from "react";
import type { PDFPageProxy } from "pdfjs-dist";

export type PdfPageCanvasProps = {
  getPage: (pageNumber: number) => Promise<PDFPageProxy>;
  pageNumber: number;
  scale: number;
  className?: string;
};

/**
 * Renders one PDF page to a canvas via pdfjs-dist. Rendered once per
 * page/scale change at a fixed resolution (see AnswerSheetViewer's
 * PDF_RENDER_SCALE) — zoom is then applied with CSS on the wrapper, the same
 * way the image answer-sheet path already handles zoom, rather than
 * re-rendering the PDF on every zoom step.
 */
export function PdfPageCanvas({ getPage, pageNumber, scale, className }: PdfPageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let renderTask: { cancel: () => void } | null = null;

    async function run() {
      if (!cancelled) setError(null);
      try {
        const page = await getPage(pageNumber);
        if (cancelled) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const viewport = page.getViewport({ scale });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const task = page.render({ canvas, viewport });
        renderTask = task;
        await task.promise;
      } catch (err) {
        const isCancellation = err instanceof Error && err.name === "RenderingCancelledException";
        if (!cancelled && !isCancellation) {
          setError(err instanceof Error ? err.message : "Failed to render page");
        }
      }
    }

    run();
    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [getPage, pageNumber, scale]);

  if (error) {
    return <p className="text-sm text-ink-secondary">Couldn&apos;t render this page: {error}</p>;
  }

  return <canvas ref={canvasRef} className={className} />;
}
