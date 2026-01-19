import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { NavHeader } from '@/components/layout/nav-header'
import { ThemeProvider } from '@/components/providers/theme-provider'

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
})
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
})

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'https://cms-compliance-assistant.vercel.app'
  ),
  title: {
    default: 'CMS Compliance Assistant',
    template: '%s | CMS Compliance Assistant',
  },
  description:
    'AI-powered Medicare compliance assistance. Check visit notes for CMS requirements and ask questions about Medicare regulations.',
  keywords: [
    'Medicare',
    'CMS',
    'compliance',
    'home health',
    'visit notes',
    'healthcare',
    'AI assistant',
    'documentation',
  ],
  openGraph: {
    title: 'CMS Compliance Assistant',
    description:
      'AI-powered Medicare compliance assistance. Check visit notes for CMS requirements and ask questions about Medicare regulations.',
    type: 'website',
    siteName: 'CMS Compliance Assistant',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CMS Compliance Assistant',
    description:
      'AI-powered Medicare compliance assistance. Check visit notes for CMS requirements and ask questions about Medicare regulations.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <NavHeader />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
