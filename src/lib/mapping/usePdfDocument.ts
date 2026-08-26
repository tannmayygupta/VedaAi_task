"use client";

import { useEffect, useState } from "react";
import type { PDFPageProxy } from "pdfjs-dist";

export type PdfDocumentState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; numPages: number; getPage: (pageNumber: number) => Promise<PDFPageProxy> };

const LOADING_STATE: PdfDocumentState = { status: "loading" };

/**
 * Loads a PDF (by URL) via pdfjs-dist for the answer sheet viewer, so PDF
 * pages can be rendered to a canvas the same way image answer sheets are
 * shown, including the real page count (replacing the old hardcoded "1 page"
 * placeholder for any PDF).
 */
export function usePdfDocument(url: string | null): PdfDocumentState {
  const [state, setState] = useState<PdfDocumentState>(LOADING_STATE);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!url) {
        if (!cancelled) setState(LOADING_STATE);
        return;
      }
      if (!cancelled) setState(LOADING_STATE);
      try {
        const { getPdfDocument } = await import("@/lib/pdf/pdfjs");
        const pdf = await getPdfDocument(url);
        if (!cancelled) {
          setState({
            status: "ready",
            numPages: pdf.numPages,
            getPage: (pageNumber: number) => pdf.getPage(pageNumber),
          });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            status: "error",
            message: error instanceof Error ? error.message : "Failed to load PDF",
          });
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [url]);

  return state;
}
