# SPEC-04 — Prior Knowledge Reliability Improvements

This spec documents improvements to the `priorKnowledge` feature implemented in SPEC-02 to address reliability issues discovered during real-world testing.

---

## 1) Background

### 1.1 Problem Statement

Analysis of test execution sessions in `test-artifacts/llm-knowledge/` revealed that LLM agents were not effectively using the `priorKnowledge` feature. The feature designed to inject "what worked last time" hints was failing to provide useful suggestions due to several data quality and scoring issues.

### 1.2 Issues Identified

| Issue                      | Severity | Root Cause                                         |
| -------------------------- | -------- | -------------------------------------------------- |
| Zero testIds recorded      | Critical | `page.locator().all()` timing issues with React    |
| 'unknown' screens          | High     | URL-based screens (send/swap/bridge) not detected  |
| Ephemeral a11yRefs         | High     | No fallback to a11yHint when testId unavailable    |
| No observability           | Medium   | priorKnowledge not logged in step records          |
| Inflated similarity scores | Medium   | 'unknown' screen matches boosted score incorrectly |

---

## 2) Implemented Fixes

### 2.1 Fix: collectTestIds Reliability (REVERTED)

**File:** `mcp-server/discovery.ts`

**Original Problem:** `page.locator('[data-testid]').all()` followed by individual attribute queries was returning empty arrays due to element detachment in React's dynamic DOM.

**Original Solution:** Rewrote to use `page.evaluate()` which executes JavaScript directly in the browser context.

**Why It Was Reverted:** `page.evaluate()` injects JavaScript into the page context, which is blocked by LavaMoat's scuttling mode. LavaMoat restricts access to certain globals (like `setInterval`) in the page context for security, causing errors like:

```
LavaMoat - property "setInterval" of globalThis is inaccessible under scuttling mode
```

**Current Solution:** Use Playwright's locator API (`page.locator().all()`) which uses the Chrome DevTools Protocol instead of injecting JavaScript. This approach:

1. Works with LavaMoat's security restrictions
2. Handles element detachment gracefully with try/catch
3. Uses only Playwright's built-in methods (`getAttribute`, `isVisible`, `textContent`)

```typescript
export async function collectTestIds(
  page: Page,
  limit: number = 150,
): Promise<TestIdItem[]> {
  await page.waitForLoadState('domcontentloaded').catch(() => undefined);

  // Use Playwright's locator API instead of page.evaluate()
  // because LavaMoat's scuttling mode blocks JavaScript execution in page context
  const locators = await page.locator('[data-testid]').all();
  const results: TestIdItem[] = [];

  for (const locator of locators) {
    if (results.length >= limit) break;

    try {
      const testId = await locator.getAttribute('data-testid');
      if (!testId) continue;

      const isVisible = await locator.isVisible().catch(() => false);
      const textContent = await locator
        .textContent()
        .then((text) => text?.trim().substring(0, 100) || undefined)
        .catch(() => undefined);

      results.push({
        testId,
        tag: 'element', // Can't get tagName without evaluate()
        text: textContent,
        visible: isVisible,
      });
    } catch {
      // Element detached from DOM during iteration (React re-render)
      continue;
    }
  }

  return results;
}
```

**Trade-off:** The `tag` field now returns a generic `'element'` instead of the actual HTML tag name, since getting the tag name requires `evaluate()` which is blocked by LavaMoat. This is acceptable because:

1. The `testId` is the primary identifier used for interactions
2. The `tag` field was primarily for debugging/display purposes
3. LavaMoat compatibility is more important than tag name accuracy

### 2.2 Fix: URL-Based Screen Detection

**Files:**

- `types.ts` — Added new screen types
- `extension-launcher.ts` — Added URL-based detection

**Problem:** The `detectCurrentScreen()` function only checked for specific testId selectors, missing URL-based screens.

**Solution:** Added new screen types and URL-based detection that runs before testId-based detection.

**New screen types added:**

```typescript
export type ScreenName =
  | 'unlock' | 'home' | 'settings'
  | 'send' | 'swap' | 'bridge'                        // NEW
  | 'confirm-transaction' | 'confirm-signature'       // NEW
  | 'notification'                                    // NEW
  | 'onboarding-welcome' | 'onboarding-import' | ...
  | 'unknown';
```

**URL detection patterns:**

```typescript
const urlPatterns = [
  { pattern: /^\/send/u, screen: 'send' },
  { pattern: /^\/swap/u, screen: 'swap' },
  { pattern: /^\/bridge/u, screen: 'bridge' },
  { pattern: /^\/confirm-transaction/u, screen: 'confirm-transaction' },
  { pattern: /^\/confirm-signature/u, screen: 'confirm-signature' },
];
```

### 2.3 Fix: a11yHint Fallback for Target Suggestions

**Files:**

- `mcp-server/types.ts` — Added `a11yHint` field to `PriorKnowledgeSimilarStep`
- `mcp-server/knowledge-store.ts` — Added lookup and fallback logic

**Problem:** When testIds weren't available in prior steps, `buildPreferredTarget()` returned `null`, making `suggestedNextActions` useless. Step records contain a11y nodes with role+name that weren't being used.

**Solution:**

1. Added `a11yHint` field to `PriorKnowledgeSimilarStep`:

```typescript
export type PriorKnowledgeSimilarStep = {
  // ... existing fields ...
  a11yHint?: { role: string; name: string };
  confidence: number;
};
```

2. Added `lookupA11yHint()` method to resolve a11yRef to role+name:

```typescript
private lookupA11yHint(step: StepRecord): { role: string; name: string } | undefined {
  const a11yRef = step.tool.target?.a11yRef;
  if (!a11yRef) return undefined;

  const nodes = step.observation?.a11y?.nodes ?? [];
  const matchingNode = nodes.find((node) => node.ref === a11yRef);
  if (!matchingNode || !matchingNode.name) return undefined;

  return { role: matchingNode.role, name: matchingNode.name };
}
```

3. Updated `buildPreferredTarget()` to use a11yHint as fallback:

```typescript
private buildPreferredTarget(
  priorStep: PriorKnowledgeSimilarStep,
  visibleTestIdSet: Set<string>,
): PriorKnowledgeTarget | null {
  // Priority 1: testId (stable, preferred)
  if (priorStep.target?.testId && visibleTestIdSet.has(priorStep.target.testId)) {
    return { type: 'testId', value: priorStep.target.testId };
  }

  // Priority 2: CSS selector (fallback)
  if (priorStep.target?.selector) {
    return { type: 'selector', value: priorStep.target.selector };
  }

  // Priority 3: a11yHint (NEW - role+name from observation)
  if (priorStep.a11yHint) {
    return { type: 'a11yHint', value: priorStep.a11yHint };
  }

  return null;
}
```

### 2.4 Fix: Log priorKnowledge in Step Records

**Files:**

- `mcp-server/types.ts` — Added `priorKnowledge` to `StepRecordObservation`
- `mcp-server/knowledge-store.ts` — Updated `createDefaultObservation()`
- `mcp-server/tools/discovery-tools.ts` — Reordered to log priorKnowledge

**Problem:** `priorKnowledge` was generated AFTER `recordStep()` was called, so it wasn't captured in step records for debugging and observability.

**Solution:**

1. Added `priorKnowledge` field to `StepRecordObservation`:

```typescript
export type StepRecordObservation = {
  state: ExtensionState;
  testIds: TestIdItem[];
  a11y: { nodes: A11yNodeTrimmed[] };
  priorKnowledge?: PriorKnowledgeV1; // NEW
};
```

2. Updated `createDefaultObservation()` signature:

```typescript
export function createDefaultObservation(
  state: ExtensionState,
  testIds: TestIdItem[] = [],
  a11yNodes: A11yNodeTrimmed[] = [],
  priorKnowledge?: PriorKnowledgeV1, // NEW parameter
): StepRecordObservation;
```

3. Reordered `handleDescribeScreen()` to generate priorKnowledge BEFORE calling `recordStep()`:

```typescript
// Generate priorKnowledge FIRST
const priorKnowledge = await knowledgeStore.generatePriorKnowledge(...);

// THEN record step with priorKnowledge included
await knowledgeStore.recordStep({
  // ...
  observation: createDefaultObservation(state, testIds, nodes, priorKnowledge),
});

// Return same priorKnowledge to client
return createSuccessResponse({ ..., priorKnowledge });
```

### 2.5 Fix: Reduce Weight of 'unknown' Screen Matches

**File:** `mcp-server/knowledge-store.ts`

**Problem:** When both the current screen and a prior step's screen were 'unknown', the `sameScreen` bonus (+8 points) was still awarded, causing inflated similarity scores and noisy suggestions.

**Solution:** Skip the `sameScreen` bonus when both screens are 'unknown':

```typescript
private computeSimilarityScore(...): number {
  let score = 0;

  const stepScreen = step.observation?.state?.currentScreen;
  const contextScreen = context.currentScreen;

  // Only award sameScreen bonus for meaningful screen matches
  if (stepScreen === contextScreen && stepScreen !== 'unknown') {
    score += SIMILARITY_WEIGHTS.sameScreen;
  }

  // ... rest of scoring logic
}
```

---

## 3) Files Modified

| File                                  | Changes                                                                                                                                   |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `mcp-server/discovery.ts`             | Rewrote `collectTestIds` using `page.evaluate()`                                                                                          |
| `types.ts`                            | Added screen types: send, swap, bridge, confirm-transaction, confirm-signature, notification                                              |
| `extension-launcher.ts`               | Added `detectScreenFromUrl()` method                                                                                                      |
| `mcp-server/types.ts`                 | Added `a11yHint` to `PriorKnowledgeSimilarStep`, `priorKnowledge` to `StepRecordObservation`                                              |
| `mcp-server/knowledge-store.ts`       | Added `lookupA11yHint()`, updated `buildPreferredTarget()`, `createDefaultObservation()`, `computeSimilarityScore()`, `getSimilarSteps()` |
| `mcp-server/tools/discovery-tools.ts` | Reordered `handleDescribeScreen()` to log priorKnowledge                                                                                  |

---

## 4) Expected Outcomes

### 4.1 Before vs After

| Scenario                            | Before                 | After                                                           |
| ----------------------------------- | ---------------------- | --------------------------------------------------------------- |
| testIds on home screen              | 0 items                | 50+ items                                                       |
| Screen on `/send/` URL              | `'unknown'`            | `'send'`                                                        |
| suggestedNextActions without testId | `null` (no suggestion) | `{ type: 'a11yHint', value: { role: 'button', name: 'Send' } }` |
| Step record observability           | No priorKnowledge      | Full priorKnowledge captured                                    |
| Two 'unknown' screens similarity    | +8 bonus awarded       | +0 (no bonus)                                                   |

### 4.2 Example priorKnowledge Response

After these fixes, a typical `mm_describe_screen` response on the send screen will include:

```json
{
  "priorKnowledge": {
    "schemaVersion": 1,
    "suggestedNextActions": [
      {
        "rank": 1,
        "action": "click",
        "rationale": "Used 3 times successfully on this screen",
        "confidence": 0.85,
        "preferredTarget": {
          "type": "testId",
          "value": "send-page-recipient-input"
        }
      },
      {
        "rank": 2,
        "action": "type",
        "rationale": "Most common next successful step on this screen",
        "confidence": 0.72,
        "preferredTarget": {
          "type": "a11yHint",
          "value": { "role": "textbox", "name": "Amount" }
        }
      }
    ],
    "similarSteps": [
      {
        "tool": "mm_click",
        "screen": "send",
        "target": { "testId": "send-page-recipient-input" },
        "a11yHint": { "role": "textbox", "name": "Recipient address" },
        "confidence": 0.85
      }
    ]
  }
}
```

---

## 5) Test Plan

### 5.1 Manual Verification

1. **testId collection**: Call `mm_list_testids` on home screen, verify 50+ items returned
2. **Screen detection**: Navigate to `#/send/`, call `mm_get_state`, verify `currentScreen: 'send'`
3. **a11yHint fallback**: Create session using only a11yRefs, verify `suggestedNextActions` contains a11yHint targets
4. **Observability**: Check step records in `test-artifacts/llm-knowledge/*/steps/*.json`, verify `priorKnowledge` field present
5. **Similarity scoring**: Verify steps with 'unknown' screens don't dominate suggestions

### 5.2 Regression Verification

- Existing `mm_describe_screen` clients continue to work (priorKnowledge is optional)
- Screenshots remain opt-in
- No breaking changes to tool input/output schemas

---

## 6) References

- SPEC-00: MetaMask Visual Testing MCP Server + Knowledge Store (v1)
- SPEC-01: Knowledge Store Schema
- SPEC-02: `mm_describe_screen.priorKnowledge` (Knowledge Reuse Injection)
- SPEC-03: Knowledge Search Improvements (Tokenized Search + Session Ranking)
