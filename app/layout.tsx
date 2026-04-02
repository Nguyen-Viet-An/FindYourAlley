import type { Metadata } from 'next'
import { Baloo_2 } from 'next/font/google'
import {
  ClerkProvider,
} from '@clerk/nextjs'

import './globals.css'

const baloo2 = Baloo_2({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-poppins',
})

export const metadata: Metadata = {
  title: 'Find Your Alley',
  description: 'Find Your Alley is a platform for event management.',
  icons: {
    icon: '/assets/images/squid.png'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){try{var d=document.documentElement,t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){d.classList.add('dark')}else{d.classList.remove('dark')}}catch(e){}})()`,
            }}
          />
        </head>
        <body className={`${baloo2.variable} bg-background text-foreground`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}