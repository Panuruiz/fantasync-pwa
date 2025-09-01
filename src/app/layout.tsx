import type { Metadata, Viewport } from 'next'
import { Inter, Cinzel, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { RLSBannerWrapper } from '@/components/dev/rls-banner-wrapper'

const inter = Inter({ subsets: ['latin'] })
const cinzel = Cinzel({ subsets: ['latin'] })
const jetBrainsMono = JetBrains_Mono({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Fantasync PWA',
  description: 'Asynchronous role-playing platform for online games',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} ${cinzel.className} ${jetBrainsMono.className}`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}