/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // domains: ['utfs.io','firebasestorage.googleapis.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'utfs.io',
        port: ''
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: ''
      },
      {
        protocol: 'https',
        hostname: 'r2-worker.vietannguyen042002.workers.dev',
        port: ''
      }
    ]
  }
}

module.exports = nextConfig
