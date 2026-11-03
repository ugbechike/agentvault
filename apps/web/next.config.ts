import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@agentvault/shared"],
  allowedDevOrigins: ["127.0.0.1"],
  async redirects() {
    return [
      { source: "/sign-up", destination: "/sign-in", permanent: false },
      { source: "/permissions", destination: "/agents", permanent: false },
      { source: "/mcp", destination: "/agents", permanent: false },
    ];
  },
};

export default nextConfig;
