/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["react-pdf"],
  images: {
    remotePatterns: [],
  },
}

module.exports = nextConfig
