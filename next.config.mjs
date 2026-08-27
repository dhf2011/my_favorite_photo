import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack이 상위 FE 폴더를 루트로 오인하면 axios/tailwindcss를 못 찾음
  turbopack: {
    root: __dirname,
  },
  outputFileTracingRoot: __dirname,
  devIndicators: false,

  async rewrites() {
    const backend = 'https://my-favorite-photo-bf.onrender.com';
    return [
      { source: '/users/:path*', destination: `${backend}/users/:path*` },
      { source: '/api/:path*', destination: `${backend}/api/:path*` },
      { source: '/notifications/:path*', destination: `${backend}/notifications/:path*` },
      { source: '/public/:path*', destination: `${backend}/public/:path*` },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'my-favorite-photo-bf.onrender.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'be-1-yqrf.onrender.com',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
