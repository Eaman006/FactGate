import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import NextTopLoader from 'nextjs-toploader'
import './globals.css'

export const metadata: Metadata = {
  title: 'FactGate — Evidence-grounded knowledge layer',
  description: 'Extract, connect, and audit facts across your document set with traceable source evidence.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'dark light',
  themeColor: '#09090b',
  userScalable: true,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="scroll-smooth bg-background">
      <body className="min-h-screen antialiased">
        <NextTopLoader
          color="#3b82f6"
          shadow="0 0 10px #3b82f6,0 0 5px #3b82f6"
          showSpinner={false}
        />
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
