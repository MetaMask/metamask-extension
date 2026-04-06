# Tron Extension E2E Resume Plan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the currently staged Tron E2E bundle in `metamask-extension` into small reviewable branches and finish only the workflows that are actually represented by the staged files.

**Architecture:** Preserve the current staged state on a dedicated WIP branch first, then split the work from `main` into focused workflow branches. Keep `test/e2e/tests/tron/mocks/common-tron.ts` minimal in each branch by carrying only the helper additions that the branch's spec files actually use; leave unrelated staking mock expansion out unless a current test directly depends on it.

**Tech Stack:** Git, MetaMask extension E2E harness, Mockttp mocks, page objects, driver helpers

---

## Current State Snapshot

**Current staged bundle on `main`**
- `test/e2e/tests/tron/account-creation.spec.ts`
- `test/e2e/tests/tron/error-scenarios.spec.ts`
- `test/e2e/tests/tron/fee-estimation.spec.ts`
- `test/e2e/tests/tron/multi-account.spec.ts`
- `test/e2e/tests/tron/mocks/common-tron.ts`

**Important observation**
- There is no local resume-plan document or dedicated branch split in this repo yet.
- The staged `common-tron.ts` diff contains broader staking-oriented helpers than the currently staged specs obviously require.
- This repo's `AGENTS.md` forbids staging or committing unless explicitly requested by the user, so treat the branch-splitting tasks below as pending explicit permission before execution.

### Task 1: Preserve The Current Staged Bundle Before Splitting

**Files:**
- No code changes required

- [ ] **Step 1: Create a dedicated WIP branch from the current staged state**

Run:
```bash
cd /Users/ulisses/Desktop/metamask-extension
git switch -c NEB-851-extension-tron-e2e-wip
```

Expected: the staged files move with you onto a branch that exists only to preserve the current raw bundle.

- [ ] **Step 2: Record exactly what is staged on the WIP branch**

Run:
```bash
cd /Users/ulisses/Desktop/metamask-extension
git status --short --branch
git diff --cached --stat
```

Expected: the same five staged paths remain intact.

- [ ] **Step 3: Create split branches from clean `main`, not from the WIP branch**

Recommended branch names:
- `NEB-851-extension-tron-account-network`
- `NEB-851-extension-tron-send-errors`
- `NEB-851-extension-tron-multi-account`

If `NEB-851` is not the right ticket prefix, substitute the correct one consistently before starting.

### Task 2: Create The Account / Network Branch

**Files:**
- Create or port: `test/e2e/tests/tron/account-creation.spec.ts`
- Modify only if required: `test/e2e/tests/tron/mocks/common-tron.ts`

- [ ] **Step 1: Branch from `main` for the account slice**

Run:
```bash
cd /Users/ulisses/Desktop/metamask-extension
git switch main
git switch -c NEB-851-extension-tron-account-network
```

- [ ] **Step 2: Restore only the account-creation spec from the WIP branch**

Run:
```bash
cd /Users/ulisses/Desktop/metamask-extension
git restore --source NEB-851-extension-tron-e2e-wip -- \
  test/e2e/tests/tron/account-creation.spec.ts
```

- [ ] **Step 3: Only restore `common-tron.ts` if this spec actually needs new mock support**

Guidance:
- The staged account-creation spec appears to use existing `mockTronApis(mockServer, true)` helpers.
- If no new mocks are required, keep `common-tron.ts` untouched in this branch.

- [ ] **Step 4: Run the targeted extension E2E spec**

Run:
```bash
cd /Users/ulisses/Desktop/metamask-extension
yarn test:e2e:single test/e2e/tests/tron/account-creation.spec.ts --browser=chrome
```

Expected: the account-creation workflow passes locally if the test build and environment are available.

- [ ] **Step 5: Commit and push the account branch**

Run:
```bash
cd /Users/ulisses/Desktop/metamask-extension
git add test/e2e/tests/tron/account-creation.spec.ts
git commit -m "test(tron): add account creation E2E coverage"
git push -u origin NEB-851-extension-tron-account-network
```

### Task 3: Create The Send / Fee / Error Branch

**Files:**
- Create or port: `test/e2e/tests/tron/error-scenarios.spec.ts`
- Create or port: `test/e2e/tests/tron/fee-estimation.spec.ts`
- Modify: `test/e2e/tests/tron/mocks/common-tron.ts`

- [ ] **Step 1: Branch from clean `main` for the send-related slice**

Run:
```bash
cd /Users/ulisses/Desktop/metamask-extension
git switch main
git switch -c NEB-851-extension-tron-send-errors
```

- [ ] **Step 2: Restore only the send-related specs and shared mocks from the WIP branch**

Run:
```bash
cd /Users/ulisses/Desktop/metamask-extension
git restore --source NEB-851-extension-tron-e2e-wip -- \
  test/e2e/tests/tron/error-scenarios.spec.ts \
  test/e2e/tests/tron/fee-estimation.spec.ts \
  test/e2e/tests/tron/mocks/common-tron.ts
```

- [ ] **Step 3: Trim `common-tron.ts` to send-specific helpers only**

Guidance:
- Keep helpers directly used by `error-scenarios.spec.ts` and `fee-estimation.spec.ts`.
- Keep `mockTronApisWithError` if the error scenarios need it.
- Remove or postpone staking-oriented helpers such as freeze, unfreeze, reward, and withdraw mocks unless one of these two specs directly imports or exercises them.

- [ ] **Step 4: Run the targeted send/error specs**

Run:
```bash
cd /Users/ulisses/Desktop/metamask-extension
yarn test:e2e:single test/e2e/tests/tron/error-scenarios.spec.ts --browser=chrome
yarn test:e2e:single test/e2e/tests/tron/fee-estimation.spec.ts --browser=chrome
```

Expected: both send-related specs pass locally if the environment is available.

- [ ] **Step 5: Commit and push the send/error branch**

Run:
```bash
cd /Users/ulisses/Desktop/metamask-extension
git add \
  test/e2e/tests/tron/error-scenarios.spec.ts \
  test/e2e/tests/tron/fee-estimation.spec.ts \
  test/e2e/tests/tron/mocks/common-tron.ts
git commit -m "test(tron): add send and error E2E coverage"
git push -u origin NEB-851-extension-tron-send-errors
```

### Task 4: Create The Multi-Account Branch

**Files:**
- Create or port: `test/e2e/tests/tron/multi-account.spec.ts`
- Modify: `test/e2e/tests/tron/mocks/common-tron.ts`

- [ ] **Step 1: Branch from clean `main` for the multi-account slice**

Run:
```bash
cd /Users/ulisses/Desktop/metamask-extension
git switch main
git switch -c NEB-851-extension-tron-multi-account
```

- [ ] **Step 2: Restore only the multi-account files from the WIP branch**

Run:
```bash
cd /Users/ulisses/Desktop/metamask-extension
git restore --source NEB-851-extension-tron-e2e-wip -- \
  test/e2e/tests/tron/multi-account.spec.ts \
  test/e2e/tests/tron/mocks/common-tron.ts
```

- [ ] **Step 3: Trim `common-tron.ts` to multi-account helpers only**

Guidance:
- Keep `TRON_SECOND_ACCOUNT_ADDRESS`.
- Keep the parameterized `mockTronGetAccount` shape only if `multi-account.spec.ts` depends on per-address or per-balance mocking.
- Drop staking helper expansion if it is still unused by this branch.

- [ ] **Step 4: Run the targeted multi-account spec**

Run:
```bash
cd /Users/ulisses/Desktop/metamask-extension
yarn test:e2e:single test/e2e/tests/tron/multi-account.spec.ts --browser=chrome
```

Expected: the multi-account Tron flow passes locally if the environment is available.

- [ ] **Step 5: Commit and push the multi-account branch**

Run:
```bash
cd /Users/ulisses/Desktop/metamask-extension
git add \
  test/e2e/tests/tron/multi-account.spec.ts \
  test/e2e/tests/tron/mocks/common-tron.ts
git commit -m "test(tron): add multi-account E2E coverage"
git push -u origin NEB-851-extension-tron-multi-account
```

### Task 5: Leave The WIP Branch As The Safety Net Until All Split Branches Land

**Files:**
- No code changes required

- [ ] **Step 1: After each split branch, compare it back to the WIP source**

Run:
```bash
cd /Users/ulisses/Desktop/metamask-extension
git diff --stat NEB-851-extension-tron-e2e-wip -- \
  test/e2e/tests/tron/account-creation.spec.ts \
  test/e2e/tests/tron/error-scenarios.spec.ts \
  test/e2e/tests/tron/fee-estimation.spec.ts \
  test/e2e/tests/tron/multi-account.spec.ts \
  test/e2e/tests/tron/mocks/common-tron.ts
```

Expected: only intentionally deferred changes remain in the WIP branch.

- [ ] **Step 2: If staking helpers still remain unused, defer them explicitly**

Guidance:
- Do not smuggle freeze/unfreeze/reward helpers into the current PRs just because they are already in the staged diff.
- If those helpers are needed later, create a dedicated follow-up branch with a test that proves the need.
