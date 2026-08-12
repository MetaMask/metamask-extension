# AGENTS.md — E2E Testing Directory

Instructions for AI coding agents working on E2E tests in the MetaMask Browser Extension. All patterns, commands, and rules are in the canonical docs below — read those, do not duplicate.

---

## Canonical Testing Docs

- **Creating new E2E tests (agent skill / workflow):** [.cursor/skills/creating-e2e-tests/SKILL.md](../../.cursor/skills/creating-e2e-tests/SKILL.md) (symlinked from `.claude/skills/` and `.agents/skills/` — edit the `.cursor` copy only)
- **E2E testing:** [.cursor/rules/e2e-testing-guidelines/RULE.md](../../.cursor/rules/e2e-testing-guidelines/RULE.md)
- **E2E CI decision tree:** [.github/guidelines/E2E_DECISION_TREE.md](../../.github/guidelines/E2E_DECISION_TREE.md) — when E2E runs/skips, label effects, build-reuse logic
- **E2E deprecated patterns & POM anti-patterns (Bugbot):** [.cursor/BUGBOT.md](../../.cursor/BUGBOT.md) — sections **3.1–3.9**
- **Human E2E guidelines (POM best practices):** [contributor-docs extension E2E guidelines](https://github.com/MetaMask/contributor-docs/blob/main/docs/testing/e2e/extension-e2e-guidelines.md#best-practices)
- **Testing philosophy:** [docs/testing.md](../../docs/testing.md)
- **E2E Driver API:** [webdriver/README.md](./webdriver/README.md)
- **Flask E2E:** [flask/README.md](./flask/README.md)
- **Playwright benchmark:** [playwright/benchmark/README.md](./playwright/benchmark/README.md)
- **Forking mainnet for testing:** [docs/forking-mainnet-for-testing.md](../../docs/forking-mainnet-for-testing.md)
- **QA migrations:** [docs/QA_MIGRATIONS_GUIDE.md](../../docs/QA_MIGRATIONS_GUIDE.md)

---

## POM anti-patterns (quick checklist)

Before adding or reviewing E2E code, load [.cursor/BUGBOT.md](../../.cursor/BUGBOT.md) sections **3.3–3.9**. Do **not** introduce:

| Avoid                                                         | Prefer                                                |
| ------------------------------------------------------------- | ----------------------------------------------------- |
| Locators / selectors in `*.flow.ts`                           | Locators only in page objects                         |
| Flow that uses a single page object                           | Method on that page object                            |
| Local UI helpers inside `*.spec.ts`                           | Page object method or multi-page flow                 |
| `driver.clickElement` / locators in specs                     | Page object or flow calls only                        |
| Hardcoded `driver.delay` / `setTimeout` without justification | Wait for a condition; comment if delay is unavoidable |
| Page object importing/calling another page object             | Flow that owns both page objects                      |
| `try` / `catch` in page objects or flows                      | Let failures surface via waits / `check*` messages    |

Run `yarn skills` after `yarn install` if `.cursor/rules/e2e-testing-guidelines/` is missing locally.
