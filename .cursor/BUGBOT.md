  # BUGBOT Rules

## Core Mission

Automated test quality enforcement and bug detection for MetaMask Extension codebase

## Execution Protocol

### 1. Initial Setup - Unit Tests

- **ALWAYS** load and reference [unit testing guidelines](.cursor/rules/unit-testing-guidelines/RULE.md)
- Verify test file naming pattern: `*.test.{ts,tsx,js,jsx}`
- Check for proper Jest and testing library imports
- Ensure tests are colocated with implementation files

Use the rules in the [unit testing guidelines](.cursor/rules/unit-testing-guidelines/RULE.md) to enforce the test quality and bug detection.

### 2. Initial Setup - E2E Tests

- **ALWAYS** load and reference [e2e-testing-guidelines](.cursor/rules/e2e-testing-guidelines/RULE.md)
- Verify test file naming pattern: `test/e2e/**/*.spec.{ts,js}`
- Check for proper imports from the E2E framework
- Verify Page Object Model pattern is used
- Ensure tests are written in TypeScript (.spec.ts)

Use the rules in the [e2e-testing-guidelines](.cursor/rules/e2e-testing-guidelines/RULE.md) to enforce the test quality and bug detection.