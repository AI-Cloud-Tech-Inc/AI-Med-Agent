import type { Config } from 'next';

const config: Config = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    unoptimized: true,
  },
  compress: true,
  poweredByHeader: false,
};

export default config;
