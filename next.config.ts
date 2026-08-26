import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Only ever used for our own committed, trusted SVGs under public/illustrations/
    // (e.g. the Settings icon) — never for user-uploaded or remote content.
    dangerouslyAllowSVG: true,
  },
};

export default nextConfig;
