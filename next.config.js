/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features if needed
  experimental: {
    // serverActions are stable in Next.js 14
  },
  // Image optimization configuration
  images: {
    remotePatterns: [
      // Add allowed image domains here as needed
    ],
  },
}

module.exports = nextConfig
