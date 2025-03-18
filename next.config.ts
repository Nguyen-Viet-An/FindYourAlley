/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['utfs.io','firebasestorage.googleapis.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'utfs.io',
        port: ''
      }
    ]
  }
}

module.exports = nextConfig