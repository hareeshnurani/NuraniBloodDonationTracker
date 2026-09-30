import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@resvg/resvg-js", "sharp"],
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns"],
  },
  outputFileTracingIncludes: {
    "/api/requests/[id]/share-card": [
      "./src/assets/fonts/**",
      "./public/fonts/**",
    ],
  },
};

export default nextConfig;
