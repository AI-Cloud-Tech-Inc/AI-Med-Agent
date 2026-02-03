/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    unoptimized: true,
  },
  compress: true,
  poweredByHeader: false,
};

module.exports = nextConfig;
