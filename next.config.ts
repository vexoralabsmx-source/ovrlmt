import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  outputFileTracingRoot: process.cwd(),
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/dakjhsfne/image/upload/**" },
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/khxvbeau/image/upload/**" },
      { protocol: "https", hostname: "**.supabase.co", pathname: "/storage/v1/object/public/review-images/**" },
    ],
  },
  async redirects() {
    return [{ source: "/drop/playera-01", destination: "/drop/after-limits-001", permanent: true }];
  },
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
      ],
    }];
  },
};

export default nextConfig;
