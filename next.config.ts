import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // 사용자가 브라우저에서 보는 주소
        source: '/sample-report',
        // 실제로 서버가 몰래 가져와서 보여줄 진짜 주소
        destination: '/share/3cb9d56d-989c-4eb5-ba9b-19d5c7ec0722',
      },
    ];
  },
};

export default nextConfig;