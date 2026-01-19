'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/layout/theme-toggle'

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/chat', label: 'Q&A Chat' },
  { href: '/compliance', label: 'Compliance Checker' },
]

export function NavHeader() {
  const pathname = usePathname()

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="font-semibold">
          CMS Compliance Assistant
        </Link>
        <div className="flex items-center gap-4">
          <nav className="flex gap-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'text-sm transition-colors hover:text-foreground/80',
                  pathname === item.href
                    ? 'font-medium text-foreground'
                    : 'text-foreground/60'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
