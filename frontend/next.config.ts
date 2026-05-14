import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    // En Docker : le frontend contacte le backend via le réseau interne
    // API_URL=http://backend:8000 est injecté par docker-compose
    const apiUrl = process.env.API_URL || "http://localhost:8000";
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
