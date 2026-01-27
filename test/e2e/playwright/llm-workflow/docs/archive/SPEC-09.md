# SPEC-09 — Speed Improvements: Observation Policies + `mm_run_steps` Controls

This spec improves throughput for agent-driven MetaMask flows by reducing per-step overhead.

Primary observation: the runtime cost is dominated by **post-action observation collection** (testIds + a11y snapshot) rather than the action itself.

This spec is intentionally additive and should preserve functional validation behavior.

---

## 0) Scope

### In scope

- Implement a **fast observation mode** that avoids expensive discovery per step.
- Make `mm_run_steps.includeObservations` actually take effect (currently ignored).
- Allow callers (especially `mm_run_steps`) to control observation collection for:
  - `mm_click`, `mm_type`, `mm_wait_for`
  - `mm_navigate`, `mm_wait_for_notification`
  - `mm_get_state`, `mm_screenshot`
- Document architecture changes in relevant READMEs and agent guidance in the `metamask-visual-testing` skill docs.

### Not in scope

- Changing tool outputs to include observation payloads.
- Changing knowledge store schema or ranking.
- Large refactors unrelated to observation cost.

---

## 1) Background

### 1.1 Where the time goes

Many tools currently do this after every action:

- `sessionManager.getExtensionState()`
- `collectTestIds(page, 50)`
- `collectTrimmedA11ySnapshot(page)`

This is expensive and repeated for every step in a flow.

### 1.2 Existing plumbing (partial, not wired up)

- `run-tool.ts` defines `ObservationPolicy = 'none' | 'default' | 'custom'` — but **no `'failures'` option**.
- `schemas.ts` defines `includeObservations?: 'none' | 'failures' | 'all'` for `mm_run_steps` input.
- `batch.ts` (`handleRunSteps`) **completely ignores** `includeObservations` — only `steps` and `stopOnError` are used.
- `HandlerOptions` has no `observationPolicy` field, so there's no mechanism to propagate the setting.

---

## 2) Goals

1. Make long, deterministic flows faster by skipping heavy observation collection.
2. Preserve functional validation parity (actions still click/type/wait correctly).
3. Keep backward compatibility:
   - Default behavior remains equivalent to today.
4. Provide a safe middle ground (`failures`) that captures rich context when something breaks.

---

## 3) Non-Goals

- Do not remove the knowledge store.
- Do not remove discovery tools (`mm_describe_screen`, `mm_list_testids`, `mm_accessibility_snapshot`).
- Do not introduce new dependencies.

---

## 4) Design

### 4.1 Observation modes

Define per-step observation behavior as follows:

- **all**: record full observation (state + testIds + a11y nodes) after each step.
- **none**: record minimal observation (state only); skip testIds and a11y snapshot.
- **failures**: record minimal observation on success; record full observation only when a step fails.

Rationale:

- “State only” is usually enough to confirm functional progression.
- Full discovery is only needed for:
  - exploration
  - debugging failures
  - refreshing a11yRef maps

### 4.2 How observation policy is carried

Introduce an internal propagation mechanism:

- Extend `HandlerOptions` to include an `observationPolicy` override.
- `mm_run_steps` sets `HandlerOptions.observationPolicy` per step, based on `includeObservations`.
- Tools respect the override and adjust their work.

### 4.3 Important constraint: a11yRef stability

If observation is not collecting a11y snapshots, `refMap` is not refreshed.

Agent guidance (must be documented in the `metamask-visual-testing` skill docs; also update MCP README):

- In fast mode, prefer `testId` targets.
- If using `a11yRef`, call `mm_accessibility_snapshot` or `mm_describe_screen` first to refresh `refMap`.

---

## 5) Implementation Tasks (Concrete)

### Task 5.1 — Extend HandlerOptions with observation policy

> Current `HandlerOptions` only has `signal?: AbortSignal`. No `observationPolicy` field exists.

**File:**

- `test/e2e/playwright/llm-workflow/mcp-server/types/tool-inputs.ts`

**Change:**

Extend:

```ts
export type HandlerOptions = {
  signal?: AbortSignal;
};
```

To include an observation override, e.g.:

```ts
export type HandlerOptions = {
  signal?: AbortSignal;
  observationPolicy?: 'default' | 'none' | 'failures';
};
```

Notes:

- This is internal plumbing, not a new MCP tool input.
- `default` means “full observation” (current behavior).

### Task 5.2 — Update `runTool()` to honor observation policy overrides

> Current `ObservationPolicy` is `'none' | 'default' | 'custom'` — no `'failures'` option.
> No mechanism exists to override via `options?.observationPolicy`.

**File:**

- `test/e2e/playwright/llm-workflow/mcp-server/tools/run-tool.ts`

**Changes required:**

1. Add support for `failures` policy.
2. Allow `config.options?.observationPolicy` to override `config.observationPolicy`.

Required semantics:

- When policy is `none`:
  - record `ExtensionState`
  - do not collect testIds
  - do not collect a11y snapshot
  - do not update `refMap`

- When policy is `failures`:
  - success path behaves like `none`
  - error path collects full observation (state + testIds + a11y) before recording the failed step

Important: avoid re-running the action on failure. Observation collection must happen after the failure is detected.

### Task 5.3 — Make `mm_run_steps.includeObservations` effective

> The schema defines `includeObservations` (`schemas.ts:525-531`), but `handleRunSteps`
> in `batch.ts` completely ignores it — only `steps` and `stopOnError` are destructured.

**File:**

- `test/e2e/playwright/llm-workflow/mcp-server/tools/batch.ts`

**Changes required:**

- Map `includeObservations` to the new `HandlerOptions.observationPolicy`:

| includeObservations | observationPolicy |
| ------------------- | ----------------- |
| `all` (default)     | `default`         |
| `none`              | `none`            |
| `failures`          | `failures`        |

- Pass the per-step options when invoking handlers:

```ts
await handler(args, { ...options, observationPolicy });
```

### Task 5.4 — Make non-`runTool` handlers respect observation policy

> All listed files accept `_options?: HandlerOptions` but ignore it completely.
> They always collect full observations (state + testIds + a11y).

Some tools still collect observation manually (not via `runTool`), so the override would otherwise be ignored.

**Files to update (minimum):**

- `test/e2e/playwright/llm-workflow/mcp-server/tools/navigation.ts`
- `test/e2e/playwright/llm-workflow/mcp-server/tools/state.ts`
- `test/e2e/playwright/llm-workflow/mcp-server/tools/screenshot.ts`

**Required behavior:**

- If `options?.observationPolicy` is `none`:
  - record state only (no testIds/a11y)
- If `failures`:
  - on success, record state only
  - on failure, attempt to capture full observation if a page is available

Implementation strategy is flexible:

- Either refactor these tools to use `runTool()`, OR
- Gate their observation collection logic on `options.observationPolicy`.

### Task 5.5 — Documentation updates

> READMEs and skill docs mention `mm_run_steps` but don't explain `includeObservations`
> (because it doesn't do anything yet). No fast workflow guidance documented.

**Architecture changes (must document):**

- `test/e2e/playwright/llm-workflow/README.md`
- `test/e2e/playwright/llm-workflow/mcp-server/README.md`

**Agent usage guidance (must document):**

- MetaMask visual testing skill docs (`metamask-visual-testing`; typically `.claude/skills/metamask-visual-testing/SKILL.md`)

Required doc content:

- Meaning of `mm_run_steps.includeObservations` (`all` / `none` / `failures`).
- Recommended fast workflow: “1x describe → Nx batched steps → describe on churn”.
- Constraint: `a11yRef` requires a fresh snapshot/refMap.

---

## 6) Acceptance Criteria

1. `mm_run_steps({ includeObservations: 'none' })` executes without collecting testIds/a11y per step.
2. Default behavior remains unchanged when `includeObservations` is omitted.
3. `mm_run_steps({ includeObservations: 'failures' })` captures rich observation for failing steps without re-running actions.
4. Fast mode does not break functional flows (send/swap/connect/sign/tx-confirm).

---

## 7) Test Plan

### 7.1 Unit tests

- `mm_run_steps`:
  - verifies `includeObservations` maps to per-step `HandlerOptions.observationPolicy`
  - verifies step summary counts remain correct

- `runTool()`:
  - `none` skips testId/a11y collection
  - `failures` collects full observation only on errors

### 7.2 Manual perf sanity

- Run a representative 15–25 step flow twice:
  1. With default observation (`all`)
  2. With `includeObservations: 'none'`

Expected: wall-clock time decreases noticeably in mode (2).

---

## 8) Agent Usage Guidance (must be documented)

This section must be reflected in the `metamask-visual-testing` skill docs (typically `.claude/skills/metamask-visual-testing/SKILL.md`).

Recommended fast workflow:

1. Call `mm_describe_screen` (heavy, once) to discover targets.
2. Execute a deterministic action sequence with:

```json
{
  "includeObservations": "none",
  "steps": [
    { "tool": "mm_click", "args": { "testId": "..." } },
    { "tool": "mm_type", "args": { "testId": "...", "text": "..." } }
  ]
}
```

3. Call `mm_describe_screen` again after major navigation changes or if a11yRef targeting is needed.

---

## 9) Rollout Notes

- This spec is intended to be backward compatible.
- Default per-tool behavior should remain “full observation” unless a batch explicitly requests otherwise.
- If fast mode reduces the usefulness of the knowledge store for successful steps, it is an acceptable tradeoff for throughput.
