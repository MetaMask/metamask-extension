# Tron held `withFixtures` helper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a generic `startHeldFixtures` helper so Tron `network.spec.ts`
and `swap.spec.ts` can share one Chrome instance across several `it` blocks
the same way `send.spec.ts` uses `startHeldTronFixtures`.

**Architecture:** Copy the hold-promise pattern from
`startHeldTronFixtures` in `test/e2e/tests/tron/fixtures/with-tron-fixtures.ts`
and wrap `withFixtures` instead of `withTronFixtures`. Do not refactor Send
or `startHeldTronFixtures` in this plan.

**Tech Stack:** TypeScript, Mocha, `withFixtures` from `test/e2e/helpers.js`.

## Global Constraints

- New code is TypeScript.
- Do not start a Java-Tron node from this helper.
- Do not change `send.spec.ts` or `startHeldTronFixtures`.
- Colocate a unit test only if the helper can be tested without Chrome. It
  cannot; the consuming E2E specs are the verification.

---

### Task 1: Add `startHeldFixtures`

**Files:**
- Create: `test/e2e/fixtures/held-fixtures.ts`

**Interfaces:**
- Consumes: `withFixtures` from `test/e2e/helpers.js`
- Produces: `HeldFixturesSession`, `startHeldFixtures(options)`

- [ ] **Step 1: Add the helper**

Create `test/e2e/fixtures/held-fixtures.ts`:

```typescript
import { withFixtures } from '../helpers';

type WithFixturesOptions = Parameters<typeof withFixtures>[0];
type WithFixturesTestSuite = Parameters<typeof withFixtures>[1];
export type HeldFixturesContext = Parameters<WithFixturesTestSuite>[0];

export type HeldFixturesSession = {
  context: HeldFixturesContext;
  release: (error?: unknown) => Promise<void>;
};

/**
 * Starts `withFixtures` and keeps the browser session open until `release`
 * is called. Pair with Mocha `before`/`after` so several `it` blocks can
 * share one extension start.
 *
 * @param options - The same options as `withFixtures`.
 * @returns The live fixture context and a `release` function that lets
 * `withFixtures` finish (and tear down) once the suite is done.
 */
export async function startHeldFixtures(
  options: WithFixturesOptions,
): Promise<HeldFixturesSession> {
  let resolveHold: () => void = () => undefined;
  let rejectHold: (error: unknown) => void = () => undefined;
  const hold = new Promise<void>((resolve, reject) => {
    resolveHold = resolve;
    rejectHold = reject;
  });

  let resolveContext: (context: HeldFixturesContext) => void = () => undefined;
  let rejectContext: (error: unknown) => void = () => undefined;
  const contextReady = new Promise<HeldFixturesContext>((resolve, reject) => {
    resolveContext = resolve;
    rejectContext = reject;
  });

  const fixturesRun = withFixtures(options, async (context) => {
    resolveContext(context);
    await hold;
  }).catch((error: unknown) => {
    rejectContext(error);
    throw error;
  });

  try {
    const context = await contextReady;
    return {
      context,
      release: async (error?: unknown) => {
        if (error) {
          rejectHold(error);
        } else {
          resolveHold();
        }
        await fixturesRun;
      },
    };
  } catch (error) {
    await fixturesRun.catch(() => undefined);
    throw error;
  }
}
```

This is the same control-flow as `startHeldTronFixtures`
(`test/e2e/tests/tron/fixtures/with-tron-fixtures.ts` around the
`startHeldTronFixtures` export). Keep the JSDoc: callers need to know
`release` must run in `after`, including on failure.

- [ ] **Step 2: Typecheck the new file**

Run:

```bash
yarn lint:changed:fix
```

Expected: no ESLint/format errors on `test/e2e/fixtures/held-fixtures.ts`.

- [ ] **Step 3: Commit**

```bash
git add test/e2e/fixtures/held-fixtures.ts
git commit -m "test(e2e): add startHeldFixtures for shared Chrome sessions"
```
