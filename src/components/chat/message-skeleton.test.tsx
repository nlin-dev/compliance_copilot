import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MessageSkeleton, ChatLoadingSkeleton } from './message-skeleton'

describe('MessageSkeleton', () => {
  describe('user message skeleton', () => {
    it('renders a right-aligned skeleton for user messages', () => {
      render(<MessageSkeleton role="user" />)

      const container = screen.getByTestId('message-skeleton-user')
      expect(container).toHaveClass('items-end')
    })

    it('renders a shorter skeleton for user messages', () => {
      render(<MessageSkeleton role="user" />)

      // User skeletons should exist and be shorter (no multi-line content)
      const container = screen.getByTestId('message-skeleton-user')
      const skeletons = container.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBeGreaterThan(0)
    })
  })

  describe('assistant message skeleton', () => {
    it('renders a left-aligned skeleton for assistant messages', () => {
      render(<MessageSkeleton role="assistant" />)

      const container = screen.getByTestId('message-skeleton-assistant')
      expect(container).toHaveClass('items-start')
    })

    it('includes source card placeholder for assistant messages', () => {
      render(<MessageSkeleton role="assistant" />)

      const sourcePlaceholder = screen.getByTestId('source-skeleton')
      expect(sourcePlaceholder).toBeInTheDocument()
    })
  })
})

describe('ChatLoadingSkeleton', () => {
  it('renders multiple skeleton message pairs', () => {
    render(<ChatLoadingSkeleton />)

    const userSkeletons = screen.getAllByTestId('message-skeleton-user')
    const assistantSkeletons = screen.getAllByTestId('message-skeleton-assistant')

    expect(userSkeletons.length).toBeGreaterThanOrEqual(2)
    expect(assistantSkeletons.length).toBeGreaterThanOrEqual(2)
  })

  it('shows skeletons in conversation order (user then assistant)', () => {
    render(<ChatLoadingSkeleton />)

    const container = screen.getByTestId('chat-loading-skeleton')
    const skeletons = container.querySelectorAll('[data-testid^="message-skeleton"]')

    // First should be user, second should be assistant (alternating pattern)
    expect(skeletons[0]).toHaveAttribute('data-testid', 'message-skeleton-user')
    expect(skeletons[1]).toHaveAttribute('data-testid', 'message-skeleton-assistant')
  })
})
