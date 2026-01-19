'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { MessageBubble } from './message-bubble'
import { BookOpen, Sparkles } from 'lucide-react'
import type { Message } from '@/hooks/use-chat-stream'

interface MessageListProps {
  messages: Message[]
  isStreaming: boolean
  onSendMessage?: (message: string) => void
}

const SUGGESTED_QUESTIONS = [
  'What qualifies a patient as homebound?',
  'What must be in the plan of care?',
  'When is skilled nursing considered necessary?',
  'What are the face-to-face encounter requirements?',
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export function MessageList({
  messages,
  isStreaming,
  onSendMessage,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="max-w-xl space-y-8 text-center"
        >
          <motion.div variants={item} className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 animate-pulse rounded-full bg-primary/20 blur-xl" />
              <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10">
                <BookOpen className="h-10 w-10 text-primary" />
              </div>
            </div>
          </motion.div>
          <motion.div variants={item} className="space-y-3">
            <h3 className="text-2xl font-semibold">
              Ask anything about CMS requirements
            </h3>
            <p className="text-base text-muted-foreground leading-relaxed">
              Get instant answers with citations to specific manual sections
            </p>
          </motion.div>
          <motion.div
            variants={container}
            className="grid grid-cols-2 gap-3"
          >
            {SUGGESTED_QUESTIONS.map((question) => (
              <motion.div key={question} variants={item}>
                <Button
                  variant="outline"
                  className="h-auto w-full whitespace-normal p-4 text-left text-sm hover:bg-primary/5 hover:border-primary/50 transition-all duration-200 hover:shadow-md group"
                  onClick={() => onSendMessage?.(question)}
                >
                  <span className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-primary flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                    <span>{question}</span>
                  </span>
                </Button>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full" ref={scrollRef}>
      <div className="flex flex-col gap-5 p-6">
        {messages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: index * 0.05,
            }}
          >
            <MessageBubble message={message} />
          </motion.div>
        ))}
        {isStreaming &&
          messages[messages.length - 1]?.role === 'assistant' &&
          messages[messages.length - 1]?.content === '' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="max-w-[80%] rounded-xl bg-muted/50 border border-border/50 px-5 py-3">
                <div className="flex gap-1.5">
                  <motion.span
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="text-primary"
                  >
                    ●
                  </motion.span>
                  <motion.span
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.2, ease: "easeInOut" }}
                    className="text-primary"
                  >
                    ●
                  </motion.span>
                  <motion.span
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.4, ease: "easeInOut" }}
                    className="text-primary"
                  >
                    ●
                  </motion.span>
                </div>
              </div>
            </motion.div>
          )}
      </div>
    </ScrollArea>
  )
}
