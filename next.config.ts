/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
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
  },
  // Include data files (booth JSON, floor map XML, stamp rally) in serverless output
  outputFileTracingIncludes: {
    '/map': ['./*.json', './*.xml'],
    '/map/*': ['./*.json', './*.xml'],
  },
  headers: async () => [
    {
      // Cache static assets (fonts, icons) in browser for 1 year
      source: '/assets/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      ],
    },
  ],
}

module.exports = nextConfig