import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // @cloudflare/next-on-pages を使用するため output: 'export' は不要
  // API routes は edge runtime で動作する
};

export default nextConfig;
