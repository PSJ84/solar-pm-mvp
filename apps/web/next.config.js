/** @type {import('next').NextConfig} */
const nextConfig = {
  // 환경변수
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
  // 실험적 기능
  experimental: {
    // Server Actions 활성화 (Next.js 15)
  },
};

module.exports = nextConfig;
