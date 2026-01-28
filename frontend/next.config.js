/** @type {import('next').NextConfig} */
const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL;

const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    // Keep CRA-era variable working in the browser bundle during migration.
    NEXT_PUBLIC_API_URL: apiUrl,
    REACT_APP_API_URL: apiUrl,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },
};

module.exports = nextConfig;
