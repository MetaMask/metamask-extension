# State Management Guidelines

This document describes recommended practices for managing application
state within the MetaMask Extension codebase.

## Single source of truth

- Keep critical state in a single, well-defined store.
- Avoid duplicating the same state across multiple controllers.
- Prefer derived state over manually synchronized copies.

## Immutability

- Treat state as immutable.
- Always create new objects when updating state.
- Avoid in-place mutations that can lead to hard-to-debug issues.

## Async updates

- Clearly separate loading, success, and error states.
- Handle race conditions explicitly when multiple async actions interact.
- Cancel or ignore outdated requests when appropriate.

## Persistence

- Persist only what is necessary for restoring the user session.
- Avoid storing sensitive data in plain text.
- Define clear migration paths when persisted state shape changes.

## Debugging

- Add structured logs around major state transitions.
- Prefer deterministic updates to make issues reproducible.
- Keep state changes small and easy to reason about.

Clear state management improves reliability, predictability,
and long-term maintainability of the extension.
