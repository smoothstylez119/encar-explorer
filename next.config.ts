import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ci.encar.com",
      },
      {
        protocol: "https",
        hostname: "fem.encar.com",
      },
    ],
  },
};

export default nextConfig;
