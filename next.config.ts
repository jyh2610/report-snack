import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // 빌드할 때 ESLint 오류가 나와도 무시하고 진행
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
