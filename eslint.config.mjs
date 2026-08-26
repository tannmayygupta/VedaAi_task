import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Allow an underscore-prefixed name to signal an intentionally-unused
      // parameter (common in stub functions awaiting a later phase's real
      // implementation, e.g. Phase 3/4 extraction stubs).
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // pdf.worker.min.mjs is copied from node_modules/pdfjs-dist by
    // scripts/copy-pdf-worker.mjs (postinstall) — a minified third-party
    // build artifact, not source to lint.
    "public/pdf.worker.min.mjs",
  ]),
]);

export default eslintConfig;
