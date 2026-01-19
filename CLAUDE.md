# Development Guidelines

This file provides guidance to Claude Code when working with code in this repository.

## Core Principle: Test-Driven Development

**TEST-DRIVEN DEVELOPMENT IS NON-NEGOTIABLE.**

Every single line of production code must be written in response to a failing test. No exceptions. This is not a suggestion or a preference - it is the fundamental practice that enables all other principles in this document.

### The TDD Cycle

1. **Red**: Write a failing test that describes the behavior you want
2. **Green**: Write the minimum code to make the test pass
3. **Refactor**: Improve the code while keeping tests green

Never write production code without a failing test first.

## Development Workflow

### Small, Incremental Changes

- Make one small change at a time
- Keep the codebase in a working state throughout development
- Each change should be independently testable and reviewable
- Commit frequently with clear, descriptive messages

### Test Behavior, Not Implementation

- Focus on what the code does, not how it does it
- Tests should describe the desired behavior from a user's perspective
- Avoid testing internal implementation details
- Tests should remain valid even when refactoring

## Code Quality Standards

### TypeScript

- Use strict mode (`"strict": true` in tsconfig.json)
- Prefer explicit types over `any`
- Use TypeScript's type system to catch errors at compile time
- Leverage discriminated unions and type guards

### Functional Programming

- Prefer pure functions without side effects
- Use immutable data structures
- Favor composition over inheritance
- Keep functions small and focused on a single responsibility

### Code Style

- Write self-documenting code with clear names
- Functions should do one thing and do it well
- Keep files small and focused
- Extract complex logic into well-named functions

## Working with Claude Code

### Planning Before Coding

Before writing code:

1. Understand the requirement fully
2. Identify the test cases needed
3. Plan the implementation approach
4. Consider edge cases and error handling

### Asking for Help

When you need clarification:

- Ask specific questions about requirements
- Request examples when behavior is unclear
- Suggest test cases to verify understanding
- Propose approaches and ask for feedback

### Code Review Mindset

- Expect to iterate on solutions
- Be open to feedback and suggestions
- Consider maintainability and readability
- Think about future developers who will read this code

## Skills System

This CLAUDE.md is part of a skills-based architecture. Additional detailed guidance is available in the `~/.claude/skills/` directory and will be loaded on-demand when needed:

- **tdd**: Test-driven development patterns and practices
- **testing**: Comprehensive testing strategies and examples
- **typescript-strict**: TypeScript strict mode guidelines
- **functional**: Functional programming principles
- **refactoring**: Safe refactoring techniques
- **expectations**: Setting and managing expectations
- **planning**: Project planning and breakdown
- **front-end-testing**: Frontend-specific testing patterns
- **react-testing**: React component testing strategies

These skills will be automatically discovered and applied when relevant to the current task.

## App Routes

- `/` - Home page
- `/ask` - Q&A chat interface (NOT /chat)
- `/compliance` - Compliance checker

## Remember

- Test first, always
- Small changes, frequent commits
- Behavior over implementation
- Readable code is maintainable code
- When in doubt, ask questions
