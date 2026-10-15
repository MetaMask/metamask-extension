# AGENTS.md — E2E Testing Directory

Instructions for AI coding agents working on E2E tests in the MetaMask Browser Extension. All patterns, commands, and rules are in the canonical docs below — read those, do not duplicate.

**POM** (Page Object Model) is how this repo structures E2E UI automation: locators and UI actions live in page object classes under `test/e2e/page-objects/pages/`; multi-page workflows live in flows under `test/e2e/page-objects/flows/`; specs under `test/e2e/tests/` only orchestrate those methods (they must not click, fill, or wait on locators directly).

---

## Canonical Testing Docs

- **Extension testing skill (primary):** [.cursor/rules/mms-extension-testing/RULE.md](../../.cursor/rules/mms-extension-testing/RULE.md) — layer gate + routes to unit / E2E create / maintain / flakiness / POM anti-patterns. Source: [MetaMask/skills](https://github.com/MetaMask/skills) `testing/extension-testing` (edit upstream, then `yarn skills`).
- **E2E create:** `mms-extension-testing` → `references/e2e.md` → `references/e2e/writing-tests.md`
- **E2E maintain (flake / bad practices):** `mms-extension-testing` → `references/e2e.md` → `references/e2e/maintain.md`
- **E2E CI decision tree:** [.github/guidelines/E2E_DECISION_TREE.md](../../.github/guidelines/E2E_DECISION_TREE.md) — when E2E runs/skips, label effects, build-reuse logic
- **E2E deprecated patterns & POM anti-patterns (local review):** [.cursor/BUGBOT.md](../../.cursor/BUGBOT.md) — sections **3.1–3.9**. Applied by **local** review (CODEBOT / `/review` / local Bugbot run) and agent self-check, **not** by Bugbot on the PR — see skill `references/e2e/pom-antipatterns.md`.
- **Human E2E guidelines (POM best practices):** [contributor-docs extension E2E guidelines](https://github.com/MetaMask/contributor-docs/blob/main/docs/testing/e2e/extension-e2e-guidelines.md#best-practices)
- **Testing philosophy:** [docs/testing.md](../../docs/testing.md)
- **E2E Driver API:** [webdriver/README.md](./webdriver/README.md)
- **Flask E2E:** [flask/README.md](./flask/README.md)
- **Playwright migration (`*.pw.spec.ts`):** [playwright/README.md](./playwright/README.md) — Selenium → Playwright migration guide
- **Playwright benchmark:** [playwright/benchmark/README.md](./playwright/benchmark/README.md)
- **Forking mainnet for testing:** [docs/forking-mainnet-for-testing.md](../../docs/forking-mainnet-for-testing.md)
- **QA migrations:** [docs/QA_MIGRATIONS_GUIDE.md](../../docs/QA_MIGRATIONS_GUIDE.md)

Deprecated standalone skills (`mms-e2e-testing`, `mms-e2e-flakiness-patterns`) redirect to `mms-extension-testing`.

---

## POM anti-patterns (quick checklist)

Write E2E correctly from the start using `mms-extension-testing`. Before submitting, run local review against [.cursor/BUGBOT.md](../../.cursor/BUGBOT.md) sections **3.3–3.9** and the skill checklist `references/e2e/pom-antipatterns.md`. Do **not** introduce:

| Avoid                                                         | Prefer                                                |
| ------------------------------------------------------------- | ----------------------------------------------------- |
| Locators / selectors in `*.flow.ts`                           | Locators only in page objects                         |
| Flow that uses a single page object                           | Method on that page object                            |
| Local UI helpers inside `*.spec.ts`                           | Page object method or multi-page flow                 |
| `driver.clickElement` / locators in specs                     | Page object or flow calls only                        |
| Hardcoded `driver.delay` / `setTimeout` without justification | Wait for a condition; comment if delay is unavoidable |
| Page object importing/calling another page object             | Flow that owns both page objects                      |
| `try` / `catch` in page objects or flows                      | Let failures surface via waits / `check*` messages    |

Run `yarn skills` after `yarn install` if `.cursor/rules/mms-extension-testing/` is missing locally.
