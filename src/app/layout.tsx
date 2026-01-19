import type { Metadata } from 'next'
import { Fraunces, DM_Sans, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { NavHeader } from '@/components/layout/nav-header'
import { ThemeProvider } from '@/components/providers/theme-provider'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['300', '400', '600', '700'],
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '700'],
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'https://compliance-copilot.vercel.app'
  ),
  title: {
    default: 'Dashboard | Compliance Copilot',
    template: '%s | Compliance Copilot',
  },
  description:
    'AI-powered compliance validation for home health documentation. Validate visit notes against CMS requirements and query Medicare regulations.',
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
    title: 'Compliance Copilot',
    description:
      'AI-powered compliance validation for home health documentation. Validate visit notes against CMS requirements and query Medicare regulations.',
    type: 'website',
    siteName: 'Compliance Copilot',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Compliance Copilot',
    description:
      'AI-powered compliance validation for home health documentation. Validate visit notes against CMS requirements and query Medicare regulations.',
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
        className={`${fraunces.variable} ${dmSans.variable} ${jetbrainsMono.variable} font-sans antialiased min-h-screen`}
      >
        <ThemeProvider>
          <div className="flex min-h-screen flex-col">
            <NavHeader />
            <main className="flex-1">{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
