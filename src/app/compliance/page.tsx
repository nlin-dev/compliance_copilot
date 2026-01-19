import type { Metadata } from 'next'
import { ComplianceChecker } from '@/components/compliance/compliance-checker'

export const metadata: Metadata = {
  title: 'Compliance Checker',
  description:
    'Check your visit notes for CMS Medicare compliance. Paste or upload documentation to identify issues and get actionable recommendations.',
  openGraph: {
    title: 'Compliance Checker | CMS Compliance Assistant',
    description:
      'Check your visit notes for CMS Medicare compliance. Paste or upload documentation to identify issues and get actionable recommendations.',
  },
}

export default function CompliancePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <ComplianceChecker />
    </main>
  )
}
