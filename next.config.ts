import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https' as const,
        hostname: 'utfs.io',
        port: ''
      },
      {
        protocol: 'https' as const,
        hostname: 'firebasestorage.googleapis.com',
        port: ''
      },
      {
        protocol: 'https' as const,
        hostname: 'r2-worker.vietannguyen042002.workers.dev',
        port: ''
      }
    ]
  },
  // Include data files (booth JSON, floor map XML, stamp rally) in serverless output
  outputFileTracingIncludes: {
    '/[locale]/map': ['./*.json', './*.xml'],
    '/[locale]/map/*': ['./*.json', './*.xml'],
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

export default withNextIntl(nextConfig)