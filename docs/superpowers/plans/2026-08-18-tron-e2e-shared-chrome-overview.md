# Tron E2E shared-Chrome optimization — task map

> **For agentic workers:** Implement the linked plans independently. Do not
> start from this overview. REQUIRED SUB-SKILL for each plan: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans.

**Goal:** Apply the `send.spec.ts` held-session pattern (shared Chrome, skip on
first failure) to the Tron suites that can take it, fold homepage header
balance coverage into assets, and delete `check-balance.spec.ts`.

**Out of scope**

- `test/e2e/tests/tron/account-derivation.spec.ts` — already shares a Java-Tron
  node. The tests need incompatible wallet lifetimes (incremental add, enable
  Tron later, onboarding discovery). Do not share Chrome across that file.
- Rewriting `check-balance.spec.ts` in place — it is deleted as part of the
  assets plan.

**Plans**

| Workstream | Plan | Chrome sessions after |
|---|---|---|
| Shared helper | [held-fixtures](./2026-08-18-tron-held-fixtures.md) | n/a |
| Assets + delete check-balance | [assets](./2026-08-18-tron-assets-shared-chrome.md) | 1 (already has a shared node) |
| Network | [network](./2026-08-18-tron-network-shared-chrome.md) | 2 |
| Swap | [swap](./2026-08-18-tron-swap-shared-chrome.md) | 3 (5 tests share 1; 2 mock-variant tests stay 1 each) |

## Why network is 2 Chromes, not 3

The Discover-button test does not need its own session.

`Shows Tron on Networks page` only adds `manifestFlags.remoteFeatureFlags.neNetworkDiscoverButton[tron:728126428] = true`. That flag is compiled into the extension at start, but:

- The other default-fixture tests never assert the Discover button is absent.
- The production default in `test/e2e/feature-flags/feature-flag-registry.ts`
  already includes `'tron:728126428': true`.
- Enabling it for the whole default session is a no-op for “is Tron listed /
  can I select Tron”.

So the split is fixture shape, not the Discover flag:

1. **Default wallet** (+ Discover flag on): home filter listed, Tokens-tab
   listed, Networks page Discover, select Tron (select last or reset after).
2. **`showTestNetworks: true`**: Nile + Shasta.

Do not start a Java-Tron node for this file. These tests never talk to Tron.

## Shared helper dependency

Network and swap use `withFixtures`, not `withTronFixtures`. Extract
`startHeldFixtures` first (`2026-08-18-tron-held-fixtures.md`). Assets already
has `startHeldTronFixtures` and does not need the generic helper.
