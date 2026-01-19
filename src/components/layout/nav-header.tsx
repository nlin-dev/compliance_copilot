'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { Pulse } from '@phosphor-icons/react/dist/ssr'

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/ask', label: 'Intelligence' },
  { href: '/compliance', label: 'Audit' },
]

export function NavHeader() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <Link
          href="/"
          className="flex items-center gap-2 group"
        >
          <Pulse weight="fill" className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
            Compliance Copilot
          </span>
        </Link>
        <div className="flex items-center gap-8">
          <nav className="flex gap-6">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'relative text-xs transition-colors',
                    isActive
                      ? 'text-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {item.label}
                  {isActive && (
                    <div className="absolute -bottom-[0.875rem] left-0 right-0 h-px bg-primary" />
                  )}
                </Link>
              )
            })}
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
