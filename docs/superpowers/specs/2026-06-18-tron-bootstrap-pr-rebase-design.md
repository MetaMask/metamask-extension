# Design: Rebase PR #43658 — Tron Bootstrap onto main

**Date:** 2026-06-18
**PR:** https://github.com/MetaMask/metamask-extension/pull/43658
**Branch:** `WPN-536-setup-local-tron-node-bootstrap`
**Jira:** WPN-536

---

## Problem

PR #43658 (`WPN-536-setup-local-tron-node-bootstrap`) diverged from `main` 14 commits ago (merge base `5b8bd1ddfe`). The single squashed commit on the PR branch contains both legitimate Tron bootstrap infrastructure AND rebase noise (package.json version downgrades, unrelated file removals). All CI jobs fail because `yarn@4.12.0` in the PR branch is incompatible with the CI actions that now expect `yarn@4.14.1`. The diff is also too large for `check-pr-max-lines`.

## Approach: New branch from main (Approach B)

Create a fresh branch from current `main`, apply only the Tron-specific changes, force-push to the PR branch. Zero conflict risk. The four shared-file patches are small and verified.

## File Scope

### New files (19 total) — checked out from `chore/tronbox-e2e-setup`

```
test/e2e/seeder/ports.ts
test/e2e/seeder/tron/assets.ts
test/e2e/seeder/tron/contracts/test-trc20.ts
test/e2e/seeder/tron/java-tron-config.ts
test/e2e/seeder/tron/node.ts
test/e2e/seeder/tron/profiles.ts
test/e2e/seeder/tron/smart-contracts.ts
test/e2e/seeder/tron/state.ts
test/e2e/seeder/tron/tron-seeder.ts
test/e2e/tests/tron/fixtures/environments.ts
test/e2e/tests/tron/fixtures/tokens.ts
test/e2e/tests/tron/fixtures/with-tron-fixtures.ts
test/e2e/tests/tron/mocks/local-tron-node-mocks.ts
test/e2e/helpers/tron-assets.test.ts
test/e2e/helpers/tron-fixtures.test.ts
test/e2e/helpers/tron-seeder.test.ts
test/e2e/helpers/tron-state.test.ts
test/e2e/scripts/smoke-local-node-ports.ts
```

### Modified existing file — checked out from `chore/tronbox-e2e-setup`

```
test/e2e/tests/tron/mocks/common-tron.ts
```

### Shared files — targeted surgical edits on main's version

| File | Change |
|---|---|
| `jest.config.js` | Add `modulePathIgnorePatterns: ['<rootDir>/.metamask/cache/java-tron-up/']` |
| `package.json` | Add scripts: `java-tron`, `java-tron-up`, `java-tron-up:install`, `test:e2e:smoke:local-node-ports`; add devDep `@metamask-previews/java-tron-up` |
| `test/e2e/constants.ts` | Add `EXPECTED_TRON_ADDRESSES_BY_INDEX`, update Tron address comments |
| `test/e2e/helpers.js` | Add `afterLocalNodesStart` option, `case 'tron'` node switch, `await afterLocalNodesStart(...)` call, pass `{ localNodes }` to `testSpecificMock` — **no** ganache/solana/bitcoin cases |

## Explicit Exclusions

- No spec files (`*.spec.ts`) — those belong to downstream PRs (#43659+)
- No page-object flow files — downstream
- No ganache/solana/bitcoin cases in `helpers.js`
- No bitcoin/solana scripts or devDeps in `package.json`
- No UI files, no snapshot files, no defi-referral files

## Execution Steps

1. `git checkout -b temp/tron-bootstrap-rebase main`
2. `git checkout chore/tronbox-e2e-setup -- <19 new/modified files>`
3. Targeted edits to `jest.config.js`, `package.json`, `test/e2e/constants.ts`, `test/e2e/helpers.js`
4. Single commit: `feat(e2e): setup local Tron node bootstrap [WPN-536]`
5. Force-push: `git push --force-with-lease origin temp/tron-bootstrap-rebase:WPN-536-setup-local-tron-node-bootstrap`
6. Verify: run `test/e2e/tests/tron/network.spec.ts` (from PR #43659) locally against the new state
7. CI triggered automatically — expected green given branch is now on current `main`

## Rollback

The current `chore/tronbox-e2e-setup` branch is never modified. If the force-push needs to be reverted, the previous branch tip is available in `git reflog`.
