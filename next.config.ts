import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: process.cwd(),
  images: {
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com", pathname: "/dakjhsfne/image/upload/**" }],
  },
  async redirects() {
    return [{ source: "/drop/playera-01", destination: "/drop/after-limits-001", permanent: true }];
  },
};

export default nextConfig;
