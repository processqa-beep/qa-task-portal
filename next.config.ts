import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.5.20', 'localhost:3000'],
  experimental: {
    // Allows network origin access during development
  },
};

export default nextConfig;
