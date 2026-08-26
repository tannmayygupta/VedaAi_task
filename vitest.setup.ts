import "@testing-library/jest-dom/vitest";

// jsdom has no DOMMatrix, but pdfjs-dist constructs one at module-load time
// (`new DOMMatrix()`) even for code paths that never touch canvas rendering
// (e.g. just reading a PDF's page count) — so importing pdfjs-dist anywhere
// in a test, even transitively, throws without this. Real canvas rendering
// is verified in a real browser (claude-in-chrome), never in jsdom, so this
// stub only needs to exist, not be a correct matrix implementation.
if (typeof globalThis.DOMMatrix === "undefined") {
  class DOMMatrixPolyfill {
    constructor(_init?: string | number[]) {}
  }
  // @ts-expect-error - minimal test-only stub, not a full DOMMatrix implementation
  globalThis.DOMMatrix = DOMMatrixPolyfill;
}
