import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Allow API calls to backend
  async rewrites() {
    return [];
  },
};

export default nextConfig;
