# System Tests with Playwright

This directory contains system-level end-to-end tests using Playwright. These tests focus on critical user flows including onboarding and transaction workflows.

## Structure

- `fixtures/` - Test fixtures and utilities for system tests
- `specs/` - Test specifications organized by feature
- `page-objects/` - Page object models specific to system tests
- `utils/` - Utility functions and helpers

## Setup

1. Install Playwright dependencies:
```bash
yarn playwright install chromium
```

2. Build the extension:
```bash
yarn dist
```

## Running Tests

Run system tests:
```bash
yarn test:e2e:system
```

Run with debug mode:
```bash
HEADLESS=false yarn test:e2e:system
```

## Test Categories

- **Onboarding**: Complete user onboarding flows
- **Transactions**: Various transaction scenarios including send, receive, and contract interactions
