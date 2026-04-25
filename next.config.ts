import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The frontend is a pure SPA-style client; we only consume an external API.
  // No image optimization config needed (the only image is the local logo).
  reactStrictMode: true,
};

export default nextConfig;
