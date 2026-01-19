import type { Metadata } from 'next'
import { ChatContainer } from '@/components/chat/chat-container'

export const metadata: Metadata = {
  title: 'Regulatory Intelligence',
  description:
    'Query Medicare coverage requirements, eligibility criteria, and documentation standards. Answers cite specific CMS manual sections.',
  openGraph: {
    title: 'Regulatory Intelligence | Compliance Copilot',
    description:
      'Query Medicare coverage requirements, eligibility criteria, and documentation standards. Answers cite specific CMS manual sections.',
  },
}

export default function ChatPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <ChatContainer />
    </div>
  )
}
