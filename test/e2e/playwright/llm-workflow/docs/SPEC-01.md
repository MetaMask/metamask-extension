# IMPROVEMENT-01 — Knowledge Reuse: Cross-Session Retrieval + Tagging (v1)

This document is an **implementation spec** for improving the existing MetaMask Visual Testing MCP knowledge store so that **agents actually reuse prior runs**, instead of recording steps but never retrieving them.

It assumes the MCP server and knowledge store described in `test/e2e/playwright/llm-workflow/SPEC.md` are already implemented.

---

## 1) Problem Statement

### Observed behavior

Two agents running the same flow sequentially (e.g. MetaMask Send flow) do not reuse the previous agent’s recorded knowledge.

### Root cause (current implementation)

The knowledge store supports cross-session search (by passing `sessionId` as `undefined`), but the MCP tool handler currently **forces session-scoped search**:

- Handler passes current `sessionId` into the search: `test/e2e/playwright/llm-workflow/mcp-server/tools/knowledge.ts`
- That means new sessions cannot discover prior sessions unless the API explicitly supports an “all sessions” mode.

### Non-goal

Do **not** rely on encoding categorization into directory names like `test-artifacts/llm-knowledge/send-flow-...`.

Directory naming is brittle and does not scale with high code churn.

---

## 2) Goals

- Enable **cross-session retrieval** for knowledge queries (search/last/summarize).
- Add lightweight **tagging** so agents can filter relevant sessions quickly and avoid context pollution.
- Keep everything **per-repo** (under `test-artifacts/llm-knowledge/`).
- Keep screenshots **opt-in** (unchanged).
- Be **backward-compatible**:
  - existing StepRecord files remain valid
  - existing tool calls remain valid

---

## 3) Overview of Proposed Solution

### A) Add cross-session scopes to knowledge tools

Extend knowledge tools to accept a `scope` parameter:

- `scope: "current"` → only active session
- `scope: "all"` → all sessions under `test-artifacts/llm-knowledge/`
- `scope: { sessionId: "mm-..." }` → a specific prior session

**Defaults**

- `mm_knowledge_search`: default `scope = "all"` (so knowledge accumulates)
- `mm_knowledge_last`: default `scope = "current"` (keeps this tool “what just happened?”)
- `mm_knowledge_summarize`: default `scope = "current"`

### B) Add per-session metadata file (structured tags)

For each launched session, write:

- `test-artifacts/llm-knowledge/<sessionId>/session.json`

This is the canonical place to store:

- tags: `flowTags` (e.g. `send`, `swap`, `connect`), plus free-form `tags`
- goal/task summary (optional)
- fixture preset / state mode
- buildType
- git branch/commit
- createdAt

This enables fast filtering without needing to rename directories.

### C) Add step-level tag(s) (optional, but useful)

Optionally extend StepRecord to include a `labels` field to help search:

- inferred label examples: `discovery`, `navigation`, `interaction`, `confirmation`, `error-recovery`

This can be purely derived from tool name and does not need agent input.

---

## 4) Data Model Changes

### 4.1 Session metadata file

**Path**

- `test-artifacts/llm-knowledge/<sessionId>/session.json`

**Schema (v1)**

```json
{
  "build": {
    "buildType": "build:test"
  },
  "createdAt": "2026-01-15T12:00:00.000Z",
  "flowTags": ["send"],
  "git": {
    "branch": "feature/foo",
    "commit": "abc123",
    "dirty": true
  },
  "goal": "Run send flow smoke test",
  "launch": {
    "stateMode": "default",
    "fixturePreset": null,
    "extensionPath": "dist/chrome",
    "ports": { "anvil": 8545, "fixtureServer": 12345 }
  },
  "schemaVersion": 1,
  "sessionId": "mm-20260115-abc",
  "tags": ["smoke"]
}
```

**Notes**

- `flowTags` should be a small controlled vocabulary; start with:
  - `send`, `swap`, `connect`, `sign`, `onboarding`, `settings`, `tx-confirmation`
- `tags` is a free-form list for ad-hoc filtering.

### 4.2 StepRecord extension (optional)

Current StepRecord is defined in `test/e2e/playwright/llm-workflow/mcp-server/types.ts`.

Add optional field:

```ts
labels?: string[];
```

Example:

- `mm_describe_screen` → `["discovery"]`
- `mm_navigate` → `["navigation"]`
- `mm_click` → `["interaction"]` (and if target includes `confirm`, add `confirmation`)
- failures → add `error-recovery`

This is helpful for search and summarization.

---

## 5) MCP Tool Schema Changes (Exact)

All changes must be additive and backward-compatible.

### 5.1 Common definitions

Introduce a shared object:

```json
{
  "KnowledgeScope": {
    "oneOf": [
      { "type": "string", "enum": ["current", "all"] },
      {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "sessionId": { "type": "string", "minLength": 4 }
        },
        "required": ["sessionId"]
      }
    ]
  }
}
```

And a filters object:

```json
{
  "KnowledgeFilters": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "flowTag": { "type": "string", "minLength": 1 },
      "tag": { "type": "string", "minLength": 1 },
      "screen": { "type": "string", "minLength": 1 },
      "sinceHours": { "type": "integer", "minimum": 1, "maximum": 720 },
      "gitBranch": { "type": "string", "minLength": 1 }
    }
  }
}
```

### 5.2 Tool: `mm_knowledge_search` (update)

**New input schema**

```json
{
  "additionalProperties": false,
  "properties": {
    "query": { "type": "string", "minLength": 1, "maxLength": 200 },
    "limit": { "type": "integer", "minimum": 1, "maximum": 100, "default": 20 },
    "scope": { "$ref": "#/definitions/KnowledgeScope", "default": "all" },
    "filters": { "$ref": "#/definitions/KnowledgeFilters" }
  },
  "required": ["query"],
  "type": "object"
}
```

**Behavior**

- If `scope = "current"`: search only current session.
- If `scope = "all"`: search all sessions.
- If `scope = { sessionId }`: search only that session.
- If filters are provided:
  - filter candidate sessions by `session.json` metadata before scanning step files.
  - filter candidate steps by `screen` when provided.

**Backward compatibility**

- If caller provides no `scope`, default to `all`.

### 5.3 Tool: `mm_knowledge_last` (update)

**New input schema**

```json
{
  "additionalProperties": false,
  "properties": {
    "n": { "type": "integer", "minimum": 1, "maximum": 200, "default": 20 },
    "scope": { "$ref": "#/definitions/KnowledgeScope", "default": "current" },
    "filters": { "$ref": "#/definitions/KnowledgeFilters" }
  },
  "type": "object"
}
```

**Behavior**

- `current`: last N for current session.
- `all`: last N across all sessions (then filters applied).

### 5.4 Tool: `mm_knowledge_summarize` (update)

Replace the current `sessionId?: string` with `scope`, but keep `sessionId` for backward compatibility.

**New input schema**

```json
{
  "additionalProperties": false,
  "properties": {
    "sessionId": {
      "type": "string",
      "minLength": 4,
      "description": "Deprecated: use scope"
    },
    "scope": { "$ref": "#/definitions/KnowledgeScope", "default": "current" }
  },
  "type": "object"
}
```

**Behavior**

- If `sessionId` provided, use it (legacy path).
- Else use `scope`.
- If `scope="all"`, return an error (`MM_INVALID_INPUT`) because summarize must target a single session.

### 5.5 New tool: `mm_knowledge_sessions` (add)

Purpose: enumerate recent sessions + metadata so agents can pick a relevant one.

**Input schema**

```json
{
  "additionalProperties": false,
  "properties": {
    "limit": { "type": "integer", "minimum": 1, "maximum": 50, "default": 10 },
    "filters": { "$ref": "#/definitions/KnowledgeFilters" }
  },
  "type": "object"
}
```

**Result**

```json
{
  "ok": true,
  "result": {
    "sessions": [
      {
        "sessionId": "mm-...",
        "createdAt": "...",
        "goal": "...",
        "flowTags": ["send"],
        "tags": ["smoke"],
        "git": { "branch": "...", "commit": "..." }
      }
    ]
  }
}
```

### 5.6 Tagging at launch (optional but recommended)

Extend `mm_launch` input to accept:

- `goal?: string`
- `flowTags?: string[]`
- `tags?: string[]`

This allows an agent (or orchestrator) to categorize sessions at creation time.

---

## 6) Implementation Steps (Concrete)

### 6.1 Add session metadata writer

Files to modify:

- `test/e2e/playwright/llm-workflow/mcp-server/session-manager.ts`
- `test/e2e/playwright/llm-workflow/mcp-server/tools/launch.ts`
- `test/e2e/playwright/llm-workflow/mcp-server/knowledge-store.ts`

Approach:

1. On successful `sessionManager.launch(...)`, immediately call `knowledgeStore.writeSessionMetadata({ ... })`.
2. Add new method in `KnowledgeStore`:
   - `writeSessionMetadata(sessionId: string, metadata: SessionMetadata): Promise<void>`
   - writes `test-artifacts/llm-knowledge/<sessionId>/session.json`

### 6.2 Add session metadata reader + cache

In `KnowledgeStore`:

- Add `readSessionMetadata(sessionId): Promise<SessionMetadata | null>`
- Add a simple in-memory cache (Map) keyed by sessionId to avoid repeated file IO during searches.

### 6.3 Implement filtering

Update knowledge store iteration:

- When searching across sessions, first list sessions (`getAllSessionIds()`), then filter using `session.json`:
  - match `flowTag` and/or `tag`
  - filter by `gitBranch` if provided
  - filter by time window (`sinceHours`) using session `createdAt`

### 6.4 Update MCP tool schemas + handlers

Files:

- `test/e2e/playwright/llm-workflow/mcp-server/types.ts`
- `test/e2e/playwright/llm-workflow/mcp-server/server.ts`
- `test/e2e/playwright/llm-workflow/mcp-server/tools/knowledge.ts`

Changes:

1. Update types:
   - `KnowledgeSearchInput` to include `scope` and `filters`.
   - `KnowledgeLastInput` to include `scope` and `filters`.
   - `KnowledgeSummarizeInput` to include `scope` (keep `sessionId` as deprecated).
2. Update tool definitions in `server.ts` inputSchema accordingly.
3. Update `tools/knowledge.ts` handlers:
   - resolve the requested session IDs based on scope.
   - call the knowledge store with `sessionId=undefined` when scope is `all`.
   - apply filters at the session selection layer.
4. Add new tool `mm_knowledge_sessions`.

### 6.5 Add StepRecord labels (optional)

File:

- `test/e2e/playwright/llm-workflow/mcp-server/knowledge-store.ts`

Approach:

- Extend `recordStep(...)` to compute `labels` based on `toolName` and outcome.
- Add `labels?: string[]` to StepRecord type.

---

## 7) Agent Usage Examples

### Example: cross-session search for send flow

1. `mm_knowledge_search({ "query": "send", "scope": "all", "filters": { "flowTag": "send", "sinceHours": 48 } })`
2. Use returned snippets to choose targets.

### Example: find most recent relevant session

1. `mm_knowledge_sessions({ "filters": { "flowTag": "send" }, "limit": 5 })`
2. Pick the newest `sessionId`.
3. `mm_knowledge_summarize({ "scope": { "sessionId": "mm-..." } })`

---

## 8) Acceptance Criteria

- Running agent A through Send flow produces `session.json` and step records.
- Running agent B in a new session can retrieve agent A’s knowledge with:
  - `mm_knowledge_search({ scope: "all", filters: { flowTag: "send" } })`
  - `mm_knowledge_sessions({ filters: { flowTag: "send" } })`
- Default `mm_knowledge_search` (no scope provided) searches across all sessions.
- Tag filters reduce irrelevant matches.
- No reliance on directory naming beyond `<sessionId>`.
- Screenshots remain opt-in.

---

## 9) Notes / Future

- This design remains compatible with a future shared/global cache by syncing `session.json` + `steps/*.json`.
- Avoid introducing a heavy index initially; start with metadata filtering + scanning.
- If performance becomes an issue, add a `_global/index.json` later.
