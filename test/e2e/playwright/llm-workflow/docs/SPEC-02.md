# SPEC-02 — `mm_describe_screen.priorKnowledge` (Knowledge Reuse Injection)

This spec defines a **non-breaking enhancement** to the existing MCP tool `mm_describe_screen` to inject prior knowledge into the response payload.

Goal: make agents reuse knowledge by default, without requiring them to remember to call `mm_knowledge_search` manually.

This document is intentionally implementation-oriented so another agent can implement it.

---

## 1) Background

### Current problem

- The knowledge store records steps (`test-artifacts/llm-knowledge/...`), but agents frequently do not query it.
- Even when a flow is repeated, agents re-discover the same selectors and navigation steps.

### Principle

`mm_describe_screen` is already the tool agents call most often. Therefore, it should include **contextual, low-noise “what worked last time” hints**.

---

## 2) Requirements

### Functional requirements

- Add `priorKnowledge` to `mm_describe_screen` response `result`.
- `priorKnowledge` MUST be derived from the existing knowledge store and current screen observation.
- `priorKnowledge` MUST be safe under high UI churn:
  - it must not rely on stale `a11yRef`s from prior sessions
  - it may recommend `testId` targets if they were observed
  - it may recommend _a11y hints_ by role+name instead of a11yRef
- It MUST be bounded (avoid huge payloads).

### Non-functional requirements

- Backward compatible: clients that ignore `priorKnowledge` continue to work.
- Screenshots remain opt-in (no behavioral change).
- Performance: query must be fast enough for interactive loops.

---

## 3) Data sources

Use existing knowledge artifacts:

- StepRecords: `test-artifacts/llm-knowledge/<sessionId>/steps/<timestamp>-<tool>.json`
- Session metadata (if present): `test-artifacts/llm-knowledge/<sessionId>/session.json`

Use current runtime context:

- Current `ExtensionState` from the active session.
- Current visible testIds and trimmed a11y nodes (already computed for describe).

---

## 4) Similarity model (how to pick relevant prior steps)

### 4.1 Candidate session filtering

Start from all sessions and filter down:

1. Prefer sessions matching the current session’s `flowTags` if present.

- If the active session was launched without `flowTags`, skip this filter.

2. Time window:

- Default search window: last **48 hours**.

3. Optional git branch filter:

- Prefer same branch as current working tree if available.

### 4.2 Candidate step filtering

Rank prior StepRecords by similarity to current describe output.

Similarity signals (suggested weights):

- Same `currentScreen` match: +8
- Current URL contains similar pathname token (e.g. `#/send/`): +6
- Overlap in visible testIds: +3 (per overlap, capped)
- Overlap in a11y node names/roles: +2 (capped)
- Same tool category (prefer steps whose tool is `mm_click`, `mm_type`, `mm_wait_for`): +2

Exclude:

- steps that are pure discovery (`mm_describe_screen`, `mm_accessibility_snapshot`) unless needed for context
- steps with `outcome.ok = false` from recommendation list (but they can be used in “avoid these”)

---

## 5) Output schema (exact)

### 5.1 Current `mm_describe_screen` result

Current payload (simplified):

```json
{
  "a11y": { "nodes": [] },
  "screenshot": null,
  "state": { "...": "ExtensionState" },
  "testIds": { "items": [] }
}
```

### 5.2 New `priorKnowledge` field

Add:

```json
{
  "priorKnowledge": {
    "schemaVersion": 1,
    "generatedAt": "2026-01-16T12:00:00.000Z",

    "query": {
      "windowHours": 48,
      "usedFlowTags": ["send"],
      "usedFilters": {
        "flowTag": "send",
        "sinceHours": 48,
        "screen": "home"
      },
      "candidateSessions": 5,
      "candidateSteps": 120
    },

    "relatedSessions": [
      {
        "sessionId": "mm-...",
        "createdAt": "...",
        "goal": "Send flow smoke",
        "flowTags": ["send"],
        "tags": ["smoke"],
        "git": { "branch": "...", "commit": "..." }
      }
    ],

    "similarSteps": [
      {
        "sessionId": "mm-...",
        "timestamp": "...",
        "tool": "mm_click",
        "screen": "home",
        "snippet": "testId: coin-overview-send, screen: home",
        "labels": ["interaction"],
        "target": {
          "testId": "coin-overview-send"
        },
        "confidence": 0.74
      }
    ],

    "suggestedNextActions": [
      {
        "rank": 1,
        "action": "click",
        "rationale": "Most common next successful step on this screen",
        "confidence": 0.74,
        "preferredTarget": {
          "type": "testId",
          "value": "coin-overview-send"
        },
        "fallbackTargets": [
          {
            "type": "a11yHint",
            "value": { "role": "button", "name": "Send" }
          }
        ]
      }
    ],

    "avoid": [
      {
        "rationale": "Frequently fails due to UI churn",
        "target": { "selector": "button.primary" },
        "errorCode": "MM_TARGET_NOT_FOUND",
        "frequency": 3
      }
    ]
  }
}
```

#### Definitions

- `similarSteps`: concise items that reference prior steps, meant for transparency.
- `suggestedNextActions`: normalized recommendations.
- `preferredTarget` should NEVER be a stale `a11yRef` from old sessions.
- `a11yHint` format: `{ role, name }`.

### 5.3 Full updated `DescribeScreenResult`

```ts
type DescribeScreenResult = {
  state: ExtensionState;
  testIds: { items: TestIdItem[] };
  a11y: { nodes: A11yNodeTrimmed[] };
  screenshot: {
    path: string;
    width: number;
    height: number;
    base64: string | null;
  } | null;
  priorKnowledge?: PriorKnowledgeV1;
};
```

---

## 6) Generation algorithm (implementation steps)

### Step 1: Gather current context

From the live `mm_describe_screen` handler:

- current `state.currentScreen`
- current `state.currentUrl` (extract route tokens like `#/send/`)
- visible testIds
- trimmed a11y nodes

### Step 2: Decide query filters

- `windowHours = 48`
- If current session has `flowTags`, set `filters.flowTag = first flowTag`
- Set `filters.screen = state.currentScreen` if not `unknown`

### Step 3: List sessions

Use knowledge store session listing:

- `mm_knowledge_sessions` logic (or direct call to knowledge store)
- apply filters

### Step 4: Score prior steps

For each candidate session:

- load steps
- compute similarity score
- keep top N (recommend N=15) for transparency

### Step 5: Build suggested actions

From top similar steps:

- focus on successful steps (`outcome.ok = true`)
- focus on tools that are actionable: `mm_click`, `mm_type`, `mm_wait_for`, `mm_navigate`, `mm_wait_for_notification`
- derive targets:
  - if the prior step used `testId`, emit preferredTarget=testId
  - else if it used selector, emit preferredTarget=selector
  - else emit preferredTarget=a11yHint (role+name) NOT a11yRef

### Step 6: Build avoid list

From failed steps in the same region:

- aggregate common `(target, errorCode)` pairs
- include if frequency >= 2

---

## 7) Limits and payload size

Hard caps:

- `relatedSessions`: max 5
- `similarSteps`: max 10
- `suggestedNextActions`: max 5
- `avoid`: max 5

No screenshots included unless explicitly requested by `mm_describe_screen` existing flags.

---

## 8) Security and privacy

- Do not include redacted text in `priorKnowledge`.
- Do not embed full step JSON in `priorKnowledge`.
- Only include the same level of summary already exposed by `mm_knowledge_search` / `mm_knowledge_last`.

---

## 9) Test plan (manual)

1. Run a “Send flow” session tagged with `flowTags:["send"]`.
2. In a new session (or same session), call `mm_describe_screen` on the home screen.
3. Verify `priorKnowledge` contains:
   - at least 1 related session
   - at least 1 suggested action referencing send-related selectors/hints
4. Verify `priorKnowledge` is empty or omitted when:
   - no sessions exist
   - no similar steps are found

---

## 10) Rollout / compatibility

- Safe to release as a minor MCP server version bump.
- Clients that do not expect `priorKnowledge` ignore it.

---

## Appendix A — Suggested TypeScript types (for implementation)

```ts
export type PriorKnowledgeTarget =
  | { type: 'testId'; value: string }
  | { type: 'selector'; value: string }
  | { type: 'a11yHint'; value: { role: string; name: string } };

export type PriorKnowledgeSuggestedAction = {
  rank: number;
  action: 'click' | 'type' | 'wait_for' | 'navigate' | 'wait_for_notification';
  rationale: string;
  confidence: number;
  preferredTarget: PriorKnowledgeTarget;
  fallbackTargets?: PriorKnowledgeTarget[];
};

export type PriorKnowledgeSimilarStep = {
  sessionId: string;
  timestamp: string;
  tool: string;
  screen: string;
  snippet: string;
  labels?: string[];
  target?: { testId?: string; selector?: string };
  confidence: number;
};

export type PriorKnowledgeV1 = {
  schemaVersion: 1;
  generatedAt: string;
  query: {
    windowHours: number;
    usedFlowTags: string[];
    usedFilters: Record<string, unknown>;
    candidateSessions: number;
    candidateSteps: number;
  };
  relatedSessions: Array<Record<string, unknown>>;
  similarSteps: PriorKnowledgeSimilarStep[];
  suggestedNextActions: PriorKnowledgeSuggestedAction[];
  avoid?: Array<Record<string, unknown>>;
};
```
