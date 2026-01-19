import type { Metadata } from 'next'
import { ChatContainer } from '@/components/chat/chat-container'

export const metadata: Metadata = {
  title: 'Q&A Chat',
  description:
    'Ask questions about CMS Medicare compliance requirements. Get AI-powered answers with source citations from official CMS documentation.',
  openGraph: {
    title: 'Q&A Chat | CMS Compliance Assistant',
    description:
      'Ask questions about CMS Medicare compliance requirements. Get AI-powered answers with source citations from official CMS documentation.',
  },
}

export default function ChatPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <ChatContainer />
    </main>
  )
}
