import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  images: {
    // Dev / self-hosted API on localhost or LAN — image optimizer otherwise blocks upstream fetch to private IPs
    dangerouslyAllowLocalIP: true,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "localhost",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "76.13.192.114",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "76.13.192.114",
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;
