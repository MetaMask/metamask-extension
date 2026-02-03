# AGENTS.md — Testing Directory

Instructions for AI coding agents working on tests in the MetaMask Browser Extension.

---

## What's in This Folder

| Directory | Description |
|-----------|-------------|
| `e2e/` | Selenium-based end-to-end tests (`.spec.ts`) |
| `e2e/page-objects/` | Page Object Model classes for E2E |
| `e2e/webdriver/` | Custom Selenium driver wrapper |
| `e2e/playwright/` | Playwright-based performance and swap tests |
| `integration/` | React component integration tests |
| `jest/` | Jest configuration and console baseline |
| `data/` | Test fixtures and mock data |
| `helpers/` | Test helper utilities |
| `lib/` | Test library utilities |
| `manual-scenarios/` | CSV-based manual test cases |

**Note:** Unit tests are colocated with source files, not in this folder.

---

## Canonical Guidelines (Read These)

All testing patterns, commands, and rules are defined in these files — do not duplicate their content.

| Topic | Canonical File |
|-------|----------------|
| **Unit testing** | [`.cursor/rules/unit-testing-guidelines/RULE.md`](../.cursor/rules/unit-testing-guidelines/RULE.md) |
| **E2E testing** | [`.cursor/rules/e2e-testing-guidelines/RULE.md`](../.cursor/rules/e2e-testing-guidelines/RULE.md) |
| **Test quality enforcement** | [`.cursor/BUGBOT.md`](../.cursor/BUGBOT.md) |
| **Testing philosophy** | [`docs/testing.md`](../docs/testing.md) |

---

## Additional Documentation

| Topic | File |
|-------|------|
| Console baseline enforcement | [`test/jest/CONSOLE-BASELINE.md`](./jest/CONSOLE-BASELINE.md) |
| E2E Driver API reference | [`test/e2e/webdriver/README.md`](./e2e/webdriver/README.md) |
| Flask E2E tests | [`test/e2e/flask/README.md`](./e2e/flask/README.md) |
| Performance benchmarks | [`test/e2e/playwright/benchmark/README.md`](./e2e/playwright/benchmark/README.md) |
| Swap tests | [`test/e2e/playwright/swap/README.md`](./e2e/playwright/swap/README.md) |
| Forking mainnet | [`docs/forking-mainnet-for-testing.md`](../docs/forking-mainnet-for-testing.md) |
| QA migrations | [`docs/QA_MIGRATIONS_GUIDE.md`](../docs/QA_MIGRATIONS_GUIDE.md) |

---

## Quick Reference

- **Unit tests**: Read [unit-testing-guidelines](../.cursor/rules/unit-testing-guidelines/RULE.md), create `.test.ts` next to source file
- **E2E tests**: Read [e2e-testing-guidelines](../.cursor/rules/e2e-testing-guidelines/RULE.md), use Page Objects, create `.spec.ts` in `test/e2e/tests/`
- **Integration tests**: Create `.test.tsx` in `test/integration/`, use React Testing Library

For commands, patterns, and detailed rules, see the canonical guideline files above.
