'use client'

import Link from 'next/link'
import { ArrowRight, BookOpen, ShieldCheck } from '@phosphor-icons/react/dist/ssr'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero Section - Editorial Layout */}
      <section className="flex-1 mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="grid md:grid-cols-12 gap-12 items-start">
          {/* Left Column - Primary Message */}
          <div className="md:col-span-7 space-y-8">
            <div className="space-y-4">
              <p className="text-caption text-muted-foreground">
                Healthcare Compliance Platform
              </p>
              <h1 className="text-display font-serif">
                Compliance Copilot
              </h1>
              <p className="text-body text-muted-foreground max-w-lg">
                Validate home health documentation against CMS requirements. Query Medicare regulations with precision. Built on 100+ pages of compliance guidelines.
              </p>
            </div>

            {/* Data Points */}
            <div className="flex gap-8 pt-4 border-t border-border">
              <div>
                <div className="font-mono text-xl font-bold text-foreground">100+</div>
                <div className="text-xs text-muted-foreground">CMS Pages</div>
              </div>
              <div>
                <div className="font-mono text-xl font-bold text-foreground">2</div>
                <div className="text-xs text-muted-foreground">Core Tools</div>
              </div>
              <div>
                <div className="font-mono text-xl font-bold text-primary">Active</div>
                <div className="text-xs text-muted-foreground">Status</div>
              </div>
            </div>
          </div>

          {/* Right Column - Quick Access */}
          <div className="md:col-span-5 space-y-3">
            <Link
              href="/ask"
              className="group block p-6 border border-border hover:border-primary/40 transition-all duration-200 interactive-lift"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <BookOpen weight="fill" className="w-4 h-4 text-[#F9FAFB]" style={{ filter: 'drop-shadow(0 0 0 hsl(var(--primary)))' }} />
                    <h2 className="text-heading font-serif">Regulatory Intelligence</h2>
                  </div>
                  <p className="text-body text-muted-foreground">
                    Query coverage requirements, eligibility criteria, and documentation standards with CMS citations.
                  </p>
                </div>
                <ArrowRight weight="bold" className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>

            <Link
              href="/compliance"
              className="group block p-6 border border-border hover:border-primary/40 transition-all duration-200 interactive-lift"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck weight="fill" className="w-4 h-4 text-[#F9FAFB]" style={{ filter: 'drop-shadow(0 0 0 hsl(var(--primary)))' }} />
                    <h2 className="text-heading font-serif">Documentation Audit</h2>
                  </div>
                  <p className="text-body text-muted-foreground">
                    Validate visit notes with pass/fail verdicts, specific findings, and remediation guidance.
                  </p>
                </div>
                <ArrowRight weight="bold" className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-6 border-t border-border">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            CMS Chapter 7 Guidelines
          </p>
          <p className="text-xs text-muted-foreground font-mono">
            v0.1.0
          </p>
        </div>
      </footer>
    </main>
  )
}
