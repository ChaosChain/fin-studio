/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || 'demo-key',
    SEARCH_API_KEY: process.env.SEARCH_API_KEY || 'demo-key',
    FINNHUB_API_KEY: process.env.FINNHUB_API_KEY || 'demo-key',
    ALPHA_VANTAGE_API_KEY: process.env.ALPHA_VANTAGE_API_KEY || 'demo-key',
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
}

module.exports = nextConfig 