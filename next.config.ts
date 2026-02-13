import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // 사용자가 브라우저에서 보는 주소
        source: '/sample-report',
        // 실제로 서버가 몰래 가져와서 보여줄 진짜 주소
        destination: '/share/9134187f-c375-4afb-ab58-4f7b0026f120',
      },
    ];
  },
};

export default nextConfig;