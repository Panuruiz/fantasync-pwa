import type { Metadata } from 'next'
import { Inter, Cinzel, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })
const cinzel = Cinzel({ subsets: ['latin'] })
const jetBrainsMono = JetBrains_Mono({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Fantasync PWA',
  description: 'Asynchronous role-playing platform for online games',
  manifest: '/manifest.json',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
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