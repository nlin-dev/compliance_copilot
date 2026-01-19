import type { Metadata } from 'next'
import { ComplianceChecker } from '@/components/compliance/compliance-checker'

export const metadata: Metadata = {
  title: 'Documentation Audit',
  description:
    'Validate visit notes against CMS requirements. Get pass/fail verdicts with specific findings, citations, and remediation guidance.',
  openGraph: {
    title: 'Documentation Audit | Compliance Copilot',
    description:
      'Validate visit notes against CMS requirements. Get pass/fail verdicts with specific findings, citations, and remediation guidance.',
  },
}

export default function CompliancePage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <ComplianceChecker />
    </div>
  )
}
