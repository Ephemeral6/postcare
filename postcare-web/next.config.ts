import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow API calls to backend
  async rewrites() {
    return [];
  },
};

export default nextConfig;
