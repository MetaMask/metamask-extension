# Extension Recipe System — Agent Brief

## 1. Mission

Build a **deterministic, reproducible validation system** for MetaMask Extension using JSON recipe files. Zero LLM calls — pure scripted execution with assertions.

**Why**: Mobile already has a proven recipe system (`validate-recipe.sh`) that runs parameterized flows via CDP. Extension has no equivalent — validation requires ad-hoc agent interactions (burning inference tokens) with no reproducibility. We want feature parity: same JSON format, same assertion operators, same composability — adapted for Playwright/MCP.

**Where**: `test/e2e/playwright/llm-workflow/recipes/`

**Key principle**: Same JSON recipe format works on both mobile and extension where actions overlap. Extension-specific actions use the `ext_` prefix and are additive — they do not break mobile schema compatibility.

**Perps note**: `getIsPerpsIncludedInBuild()` is a **compile-time flag** (`PERPS_ENABLED` at build time). The `perps.tab_visible` pre-condition is the runtime check — if the tab is not rendered, perps is not available in this build regardless of remote flags.

---

## 2. Mobile Recipe System (Full Reference)

### 2.1 Schema

The recipe JSON format is defined by `flow.schema.json`. Here is the **complete schema** (this is the actual file at `recipes/schemas/flow.schema.json`):

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "flow.schema.json",
  "title": "Agentic Flow",
  "type": "object",
  "required": ["title", "validate"],
  "additionalProperties": false,
  "properties": {
    "title": {
      "type": "string",
      "description": "Human-readable title. May contain {{param}} template tokens."
    },
    "pr": {
      "type": ["string", "number"],
      "description": "Associated PR number (informational)."
    },
    "inputs": {
      "type": "object",
      "description": "Declared parameters. Every {{param}} used in steps MUST have a matching key.",
      "additionalProperties": {
        "type": "object",
        "required": ["type"],
        "properties": {
          "type": { "enum": ["string", "number", "boolean"] },
          "default": { "description": "Default value. Single source of truth." },
          "description": { "type": "string" }
        }
      }
    },
    "initial_conditions": {
      "type": "object",
      "properties": {
        "account": { "type": "string" },
        "testnet": { "type": "boolean" },
        "provider": { "type": "string" }
      }
    },
    "validate": {
      "type": "object",
      "required": ["runtime"],
      "properties": {
        "runtime": {
          "type": "object",
          "required": ["steps"],
          "properties": {
            "pre_conditions": {
              "type": "array",
              "items": {
                "oneOf": [
                  { "type": "string", "description": "Named pre-condition (e.g. 'wallet.unlocked')" },
                  { "type": "object", "required": ["name"], "description": "Parameterized (e.g. { name: 'ext.element_visible', testId: 'app-header' })" }
                ]
              }
            },
            "steps": {
              "type": "array",
              "minItems": 1,
              "items": { "$ref": "#/$defs/step" }
            }
          }
        }
      }
    }
  }
}
```

### 2.2 Step Format

Every step has `id` (kebab-case), `action`, and optional `assert`:

```json
{
  "id": "press-long-button",
  "action": "press",
  "test_id": "perps-market-details-long-button",
  "assert": {
    "operator": "not_null",
    "field": "route",
    "value": null
  }
}
```

### 2.3 All 22 Actions — with Extension Mapping

18 mobile-origin actions + 4 extension-specific (`ext_`) actions:

| # | Action | Mobile Fields | Extension Equivalent |
|---|--------|--------------|---------------------|
| 1 | `navigate` | `target` (route name), `params` | `mm_navigate` (`screen: 'home'|'settings'|'notification'|'url'`, `url?`) or hash URL navigation |
| 2 | `eval_sync` | `expression` (ES5 JS), `assert` (required) | `page.evaluate()` on service worker page — LavaMoat-safe context |
| 3 | `eval_async` | `expression` (Promise/.then()), `assert` (required) | `page.evaluate()` with async function on service worker |
| 4 | `eval_ref` | `ref` (name from evals.json), `assert` (required) | Same pattern — resolve from evals.json, execute via appropriate eval method |
| 5 | `press` | `test_id` | `callHandler('mm_click', { testId })` |
| 6 | `scroll` | `test_id?`, `offset` (px), `animated` | `page.mouse.wheel()` or element `.scrollIntoViewIfNeeded()` |
| 7 | `set_input` | `test_id`, `value` | `callHandler('mm_type', { testId, text: value })` |
| 8 | `type_keypad` | `value` (digits+dot) | N/A on extension — map to `set_input` (extension uses regular HTML inputs) |
| 9 | `clear_keypad` | `count` (delete presses) | N/A — use triple-click + Backspace or `set_input` with empty string |
| 10 | `flow_ref` | `ref` (team/name), `params` | Recursive recipe execution — identical pattern |
| 11 | `log_watch` | `must_not_appear[]`, `watch_for[]`, `window_seconds` | Playwright `page.on('console')` event capture with time window |
| 12 | `wait` | `ms` (default 1000) | `page.waitForTimeout(ms)` |
| 13 | `wait_for` | 4 sugar forms + custom expression (see §2.4) | `callHandler('mm_wait_for', { testId })` for element waits, polling for custom conditions |
| 14 | `screenshot` | `filename` | `callHandler('mm_screenshot', { name: filename })` |
| 15 | `manual` | `note` | Pause execution, print note, wait for human input |
| 16 | `select_account` | `address` | Click account selector menu, find by address, click |
| 17 | `toggle_testnet` | `enabled` | Navigate to settings → advanced → toggle testnet networks |
| 18 | `switch_provider` | `provider` | Navigate to settings → select provider |
| 19 | `ext_navigate_hash` | `hash` (string) | Navigate to `chrome-extension://<id>/home.html#/<hash>` |
| 20 | `ext_wait_for_screen` | `screen` (string), `timeout_ms?` | Poll `mm_get_state` until screen name matches |
| 21 | `ext_switch_tab` | `role: 'extension'|'notification'|'dapp'` | Switch active Playwright page by tab role |
| 22 | `ext_check_dom` | `testId|selector`, `attribute?`, `text?`, `visible?` | Assert DOM element state |

### 2.4 `wait_for` Sugar Forms

Mobile's `wait_for` has 4 shorthand forms that auto-expand to polling expressions:

| Form | Fields | Mobile Expansion | Extension Equivalent |
|------|--------|-----------------|---------------------|
| Route match | `route: "ScreenName"` | Poll `getRoute().name === route` | Poll URL hash or `mm_get_state` for current screen |
| Route leave | `not_route: "ScreenName"` | Poll `getRoute().name !== route` | Poll URL hash change |
| Element appear | `test_id: "x"`, `visible: true` | Poll fiber tree for testID | `callHandler('mm_wait_for', { testId: "x" })` — native Playwright wait |
| Element disappear | `test_id: "x"`, `visible: false` | Poll fiber tree for absence | Poll `page.locator('[data-testid="x"]').waitFor({ state: 'hidden' })` |
| Custom | `expression`, `assert` | Poll eval expression | Poll via service worker `page.evaluate()` |

Common fields: `timeout_ms` (default 10000), `poll_ms` (default 500).

### 2.5 Assertion System

8 operators, identical on mobile and extension. Port of mobile's `assert.js` — verbatim implementation in `lib/assert.ts`:

```typescript
export function checkAssert(raw: unknown, spec: AssertSpec): boolean {
  // 1. Double-unwrap JSON strings (CDP encodes results with extra quotes)
  // 2. Dot-path field extraction via spec.field
  // 3. Apply operator
  switch (spec.operator) {
    case 'not_null':     return actual !== null && actual !== undefined;
    case 'eq':           return actual === expected;
    case 'neq':          return actual !== expected;
    case 'gt':           return typeof actual === 'number' && actual > expected;
    case 'length_eq':    return getLength(actual) === expected;
    case 'length_gt':    return getLength(actual) > expected;
    case 'contains':     return Array.isArray(actual) ? actual.includes(expected)
                                                      : typeof actual === 'string' && actual.includes(expected);
    case 'not_contains': return Array.isArray(actual) ? !actual.includes(expected)
                                                      : typeof actual !== 'string' || !actual.includes(expected);
  }
}
```

Optional `field` key uses dot-path extraction (`"state.isUnlocked"`) on the result object before applying the operator.

### 2.6 Composition via `flow_ref`

Recipes nest sub-recipes. The referenced flow's `inputs` are resolved from the caller's `params`:

```json
{
  "id": "open-long",
  "action": "flow_ref",
  "ref": "perps/navigate-perps-tab",
  "params": { "symbol": "BTC" }
}
```

The runner loads the referenced flow JSON, applies `{{param}}` substitution from `params`, and executes its steps inline.

### 2.7 Template Substitution

3-pass system (implemented in `lib/template.ts`):
1. Apply defaults from the recipe's `inputs` block
2. Apply inline defaults: `{{key|default}}` → `default` when key is unset
3. Remaining unreplaced tokens fail validation

All `{{param}}` tokens in step fields (`test_id`, `expression`, `value`, `hash`, etc.) are resolved before execution.

### 2.8 Pre-conditions

Named checks evaluated before steps run. Fail fast with actionable hints.

Pre-condition functions receive a `CallHandlerFn` (not a context object):

```typescript
type CallHandlerFn = (
  toolName: string,
  input: Record<string, unknown>
) => Promise<McpResponse<unknown>>;

type PreConditionEntry = {
  description: string;
  check: (
    callHandler: CallHandlerFn,
    params?: Record<string, unknown>
  ) => Promise<{ pass: boolean; hint: string }>;
};
```

**`extension-core` registry** (`teams/extension-core/pre-conditions.ts`):
- `wallet.unlocked` — checks `mm_get_state` → `state.isUnlocked === true`
- `extension.loaded` — checks `mm_get_state` succeeds
- `ext.element_visible` — params: `{ testId }` — waits up to 5s for element
- `ext.on_screen` — params: `{ hash }` — checks `state.currentUrl` contains hash

**`perps` registry** (`teams/perps/pre-conditions.ts`):
- `perps.tab_visible` — waits for `[data-testid="account-overview__perps-tab"]` (5s timeout). This is the runtime gate for perps availability — `getIsPerpsIncludedInBuild()` is the compile-time counterpart baked into the build.
- `perps.on_market` — checks `state.currentUrl` contains `/perps/market/`

### 2.9 Eval Refs

Reusable named expressions stored in `teams/<team>/evals.json`. Referenced by `eval_ref` steps.

Extension evals use DOM queries, `mm_get_state`, or service worker evaluation instead of CDP expressions. Example format:

```json
{
  "wallet_state": {
    "description": "Full MetaMask state snapshot",
    "expression": "JSON.stringify(await (async () => { const r = await chrome.storage.local.get('data'); return r; })())",
    "async": true
  }
}
```

---

## 3. Extension MCP Toolkit Reference

### 3.1 Tool List (24 `mm_*` tools)

**Session Management:**
| Tool | Input | Output |
|------|-------|--------|
| `mm_build` | `{ buildType?, force? }` | `{ buildType, extensionPathResolved }` |
| `mm_launch` | `{ stateMode?, fixturePreset?, fixture?, ports?, slowMo?, extensionPath?, goal?, seedContracts? }` | `{ sessionId, extensionId, state }` |
| `mm_cleanup` | `{ sessionId? }` | `{ cleanedUp }` |

**Discovery:**
| Tool | Input | Output |
|------|-------|--------|
| `mm_get_state` | `{}` | `{ state: ExtensionState, tabs? }` |
| `mm_list_testids` | `{ limit? }` | `{ items: TestIdItem[] }` |
| `mm_accessibility_snapshot` | `{ rootSelector? }` | `{ nodes: A11yNode[] }` |
| `mm_describe_screen` | `{ includeScreenshot? }` | `{ state, testIds, a11y, screenshot? }` |

**Interaction:**
| Tool | Input | Output |
|------|-------|--------|
| `mm_click` | `{ testId \| a11yRef \| selector, timeoutMs? }` | `{ clicked, target }` |
| `mm_type` | `{ testId \| a11yRef \| selector, text, timeoutMs? }` | `{ typed, target, textLength }` |
| `mm_wait_for` | `{ testId \| a11yRef \| selector, timeoutMs? }` | `{ found, target }` |
| `mm_navigate` | `{ screen: 'home'\|'settings'\|'notification'\|'url', url? }` | `{ navigated, currentUrl }` |
| `mm_clipboard` | `{ action: 'write'\|'read', text? }` | `{ action, success, text? }` |

**Tab Management:**
| Tool | Input | Output |
|------|-------|--------|
| `mm_wait_for_notification` | `{ timeoutMs? }` | `{ found, pageUrl }` |
| `mm_switch_to_tab` | `{ role?: 'extension'\|'notification'\|'dapp'\|'other', url? }` | `{ switched, activeTab }` |
| `mm_close_tab` | `{ role?, url? }` | `{ closed, closedUrl }` |

**Screenshot:**
| Tool | Input | Output |
|------|-------|--------|
| `mm_screenshot` | `{ name, fullPage?, selector?, includeBase64? }` | `{ path, width, height, base64? }` |

**Smart Contracts:**
| Tool | Input | Output |
|------|-------|--------|
| `mm_seed_contract` | `{ contractName, hardfork?, deployerOptions? }` | `{ contractName, contractAddress }` |
| `mm_seed_contracts` | `{ contracts[], hardfork? }` | `{ deployed[], failed[] }` |
| `mm_get_contract_address` | `{ contractName }` | `{ contractName, contractAddress }` |
| `mm_list_contracts` | `{}` | `{ contracts[] }` |

**Knowledge Store:**
| Tool | Input | Output |
|------|-------|--------|
| `mm_knowledge_last` | `{ n?, scope?, filters? }` | `{ steps[] }` |
| `mm_knowledge_search` | `{ query, limit?, scope? }` | `{ matches[], query }` |
| `mm_knowledge_summarize` | `{ sessionId?, scope? }` | `{ sessionId, stepCount, recipe[] }` |
| `mm_knowledge_sessions` | `{ limit?, filters? }` | `{ sessions[] }` |

**Batch Execution:**
| Tool | Input | Output |
|------|-------|--------|
| `mm_run_steps` | `{ steps: {tool, args?}[], stopOnError?, includeObservations? }` | `{ steps[], summary: {ok, total, succeeded, failed} }` |

### 3.2 Key APIs for Direct Import

From `@metamask/client-mcp-core` — the **actual imports** used in `session-bootstrap.ts`:

```typescript
// Session management
import {
  setSessionManager,       // register the ISessionManager instance
  setKnowledgeStore,       // register knowledge store (optional)
  createKnowledgeStore,    // create a fresh knowledge store
} from '@metamask/client-mcp-core';

// Tool registry
import {
  buildToolHandlersRecord,  // → Record<string, ToolHandler> — all 24 mm_* handlers
  setToolRegistry,          // wire the handler record into handleRunSteps dispatcher
  setToolValidator,         // wire safeValidateToolInput as the validator
} from '@metamask/client-mcp-core';

// Validation
import {
  validateToolInput,         // <T>(toolName, input) → T (throws on invalid)
  safeValidateToolInput,     // (toolName, input) → {success, data|error}
} from '@metamask/client-mcp-core';

// Types
type ToolHandler = (
  input: Record<string, unknown>,
  options?: { signal?: AbortSignal; observationPolicy?: 'default' | 'none' | 'failures' }
) => Promise<McpResponse<unknown>>;

type McpResponse<T> =
  | { ok: true;  meta: ResponseMeta; result: T }
  | { ok: false; meta: ResponseMeta; error: ErrorDetails };
```

### 3.3 Session Lifecycle

```
mm_launch (or bootstrapSession/bootstrapCdpSession) → [work] → mm_cleanup
```

Two session modes:
- **E2E mode** (`bootstrapSession`): uses `metaMaskSessionManager` from `mcp-server/metamask-provider.ts` — launches fresh Playwright browser with fixture state
- **CDP mode** (`bootstrapCdpSession(port)`): uses `CdpSessionManager` — connects to an **already-running** Chrome instance on the given CDP port (default `6668`). No launch, no cleanup of the browser.

In farmslot slots the browser is already running. Use CDP mode: `bootstrapCdpSession(6668)`.

---

## 4. Architecture Differences

| Aspect | Mobile (CDP) | Extension (Playwright) |
|--------|-------------|----------------------|
| Transport | CDP WebSocket to Hermes JS engine | Playwright `Page` API (Chrome DevTools Protocol under the hood) |
| In-app bridge | `globalThis.__AGENTIC__` — direct fiber tree + route access | None — DOM only. Use `data-testid`, a11y tree, URL hash |
| State access | `Engine.context.*` controllers via CDP eval | `mm_get_state` (returns `ExtensionState`), or service worker `page.evaluate()` |
| Navigation | `navigate(routeName, params)` — React Navigation API | URL hash (`#/settings`), `mm_navigate`, or click-through |
| Interaction | Fiber `onPress` / `onChangeText` — synthetic events | `page.click('[data-testid="x"]')` / `page.fill()` — real DOM events |
| Pre-conditions | CDP eval of JS expressions in app context | DOM visibility checks via `callHandler('mm_wait_for', ...)` + `mm_get_state` |
| Sandbox | Full app process — unrestricted JS eval | **LavaMoat** — blocks `setInterval`/`setTimeout` in extension `page.evaluate()`. Use service worker page as escape hatch |
| Service worker | N/A | Accessible at `chrome-extension://<ID>/service_worker.html` — unrestricted `page.evaluate()` |
| Multi-tab | Single webview | Extension page + notification popup + dapp tabs — must `ext_switch_tab` or `mm_switch_to_tab` |
| Route detection | `__AGENTIC__.getRoute().name` | URL hash parsing: `#/settings` → `settings`, `#/` → `home` |
| Perps feature | Runtime flag in Redux store | Compile-time `getIsPerpsIncludedInBuild()` + remote flag. Runtime check: `perps.tab_visible` pre-condition |
| Attached mode | N/A | `CdpSessionManager.connect(6668)` via `bootstrapCdpSession(6668)` |

---

## 5. Implementation Spec

### 5.1 File Structure

```
test/e2e/playwright/llm-workflow/recipes/
  AGENT-BRIEF.md              # This file
  validate-recipe.ts           # Main runner (TypeScript)
  validate-recipe.sh           # Bash CLI wrapper (invokes tsx)
  check-extension.ts           # Diagnostic: connect via CDP, check perps tab + build globals
  lib/
    assert.ts                  # Port of mobile assert.js (identical 8 operators)
    action-mapper.ts           # Recipe action -> tool handler call(s)
    route-map.ts               # Mobile route names -> extension URL hashes
    session-bootstrap.ts       # Bootstrap session manager + tool registry (two modes)
    pre-condition-runner.ts    # Pre-condition registry + evaluation
    eval-engine.ts             # eval_ref resolution + service worker eval
    template.ts                # {{param}} substitution (3-pass)
    cdp-session-manager.ts     # ISessionManager implementation for attached CDP mode
  schemas/
    flow.schema.json           # Shared schema (already exists — do not recreate)
  teams/
    extension-core/
      pre-conditions.ts        # wallet.unlocked, extension.loaded, ext.element_visible, ext.on_screen
      evals.json               # DOM + state-based eval refs
      flows/
        unlock-wallet.json
        navigate-settings.json
        send-eth.json
    perps/
      pre-conditions.ts        # perps.tab_visible, perps.on_market
      evals.json               # Perps-specific eval refs
      flows/
        navigate-perps-tab.json
        open-long-position.json
```

All files in `lib/`, `schemas/`, and `teams/` already exist. Do not recreate them.

### 5.2 `session-bootstrap.ts` — Actual Implementation

The real file exports two functions and a `callHandler` helper. Mirrors `mcp-server/server.ts` init pattern with `setToolRegistry` + `setToolValidator` wired up:

```typescript
import {
  setSessionManager, setKnowledgeStore, createKnowledgeStore,
  buildToolHandlersRecord, setToolRegistry, setToolValidator,
  safeValidateToolInput,
} from '@metamask/client-mcp-core';
import { createMetaMaskE2EContext } from '../../capabilities/factory';
import { metaMaskSessionManager } from '../../mcp-server/metamask-provider';
import { CdpSessionManager } from './cdp-session-manager';

// bootstrapSession() — E2E mode (launches browser)
export function bootstrapSession(): BootstrapResult { ... }

// bootstrapCdpSession(port) — CDP mode (attaches to running browser)
export async function bootstrapCdpSession(cdpPort: number): Promise<BootstrapResult> { ... }

// Both modes wire: setSessionManager → setToolRegistry → setToolValidator
// handlerRecord = buildToolHandlersRecord()
// setToolRegistry(handlerRecord)           ← required for mm_run_steps batching
// setToolValidator(safeValidateToolInput)  ← input validation

export type BootstrapResult = {
  sessionManager: ISessionManager;
  callHandler: (toolName: string, input: Record<string, unknown>) => Promise<McpResponse<unknown>>;
};
```

`callHandler` normalizes names: if you call `callHandler('mm_click', ...)` or `callHandler('click', ...)`, both work — it adds the `mm_` prefix if missing.

### 5.3 `validate-recipe.ts` — Execution Flow

```
1. Parse CLI args: --recipe <path>, --dry-run, --step <id>, --skip-manual, --param key=val
2. Load recipe JSON, validate against schemas/flow.schema.json
3. Apply {{param}} substitution (3-pass via lib/template.ts)
4. bootstrapSession() or bootstrapCdpSession() depending on --cdp-port flag
5. Evaluate pre_conditions via lib/pre-condition-runner.ts (fail fast with hints)
6. For each step in validate.runtime.steps:
   a. Map action -> tool handler call(s) via lib/action-mapper.ts
   b. Execute via callHandler or batch via handleRunSteps (non-asserting groups)
   c. If step has assert: evaluate assertion via lib/assert.ts
   d. Print PASS/FAIL per step with timing
7. Print summary: N passed, M failed, total duration
8. mm_cleanup if E2E mode (skip if CDP mode)
9. Exit 0 (all pass) or 1 (any fail)
```

### 5.4 `action-mapper.ts` — Action-to-Handler Mapping

Each action maps to one or more `callHandler` calls. Key mappings:

```typescript
case 'press':        return callHandler('mm_click', { testId: step.test_id });
case 'set_input':    return callHandler('mm_type', { testId: step.test_id, text: step.value });
case 'wait':         await page.waitForTimeout(step.ms ?? 1000); return { raw: null, ok: true };
case 'screenshot':   return callHandler('mm_screenshot', { name: step.filename ?? step.id });
case 'ext_switch_tab': return callHandler('mm_switch_to_tab', { role: step.role });
case 'navigate':     // look up route in route-map.ts; fall back to mm_navigate
case 'wait_for':     // 4 sugar forms — see §5.5
case 'eval_sync':    // service worker eval — see §5.6
case 'eval_async':   // service worker eval with async expression
case 'eval_ref':     // resolve from evals.json, then eval_sync or eval_async
case 'flow_ref':     // load sub-recipe, substitute params, run steps recursively
```

### 5.5 `navigate` Action — Route Mapping

`lib/route-map.ts` maps mobile React Navigation route names to extension URL hashes:

```typescript
const ROUTE_MAP: Record<string, string> = {
  'Home':              '#/',
  'Settings':          '#/settings',
  'SettingsGeneral':   '#/settings/general',
  'SettingsAdvanced':  '#/settings/advanced',
  'SettingsNetworks':  '#/settings/networks',
  'SendFlow':          '#/send',
  'ConfirmTransaction': '#/confirm-transaction',
};
```

If the route is found in `ROUTE_MAP`, navigate to that hash. If not found, pass through to `callHandler('mm_navigate', { screen: 'url', url: step.target })`.

### 5.6 `eval_sync` / `eval_async` — LavaMoat Escape Hatch

Mobile evals run in the app's JS context via CDP. Extension has **LavaMoat restrictions** on the extension page — `setInterval`/`setTimeout` are blocked.

**Strategy**: evaluate in the service worker page (`chrome-extension://<extensionId>/service_worker.html`). This page is not restricted by LavaMoat. Get it via:

```typescript
async function getServiceWorkerPage(ctx: RunContext): Promise<Page> {
  const swUrl = `chrome-extension://${ctx.extensionId}/service_worker.html`;
  let swPage = ctx.context.pages().find(p => p.url() === swUrl);
  if (!swPage) {
    swPage = await ctx.context.newPage();
    await swPage.goto(swUrl);
    await swPage.waitForLoadState('domcontentloaded');
  }
  return swPage;
}
```

> **NEVER** use `setInterval` or `setTimeout` in `page.evaluate()` on extension pages. Always use the service worker page for evals that need timers.

### 5.7 `wait_for` Implementation

Four sugar forms + custom expression. Element disappear uses Playwright's native `.waitFor({ state: 'hidden' })`. Route/not_route polls the URL hash. Custom expression polls via service worker `page.evaluate()` with configurable `poll_ms` (default 500).

### 5.8 Pre-condition Runner

`lib/pre-condition-runner.ts` loads pre-condition registries from both teams and evaluates them before steps run:

```typescript
type PreConditionSpec = string | { name: string; [key: string]: unknown };

async function runPreConditions(
  specs: PreConditionSpec[],
  callHandler: CallHandlerFn
): Promise<void>  // throws on failure with hint message
```

Named string specs (e.g., `"wallet.unlocked"`) look up the registry by name. Object specs (e.g., `{ name: "ext.element_visible", testId: "perps-tab" }`) pass extra fields as `params`.

### 5.9 Batch Optimization

Group consecutive non-asserting steps into `mm_run_steps` for fewer round-trips. Steps that cannot be batched: any step with `assert`, or actions `flow_ref`, `manual`, `wait_for`, `eval_sync`, `eval_async`, `eval_ref`, `log_watch`.

Batched steps map to `mm_run_steps` input:
```json
{ "steps": [
    { "tool": "mm_click", "args": { "testId": "submit-button" } },
    { "tool": "mm_type",  "args": { "testId": "amount-input", "text": "10" } }
  ],
  "stopOnError": true
}
```

### 5.10 Attached Mode — CDP Connection

When running inside a farmslot slot, the browser is already managed by `launch-browser.sh` with CDP port `6668`. Use `bootstrapCdpSession(6668)`:

```typescript
// CdpSessionManager.connect(6668) — from lib/cdp-session-manager.ts
// 1. chromium.connectOverCDP('http://localhost:6668')
// 2. resolveExtensionId() from the context
// 3. Find or navigate to chrome-extension://<id>/home.html
// 4. Returns CdpSessionManager — implements ISessionManager
// cleanup() disconnects from CDP without killing the browser
```

Detection of attached mode: check if `.agent/browser.pid` and `.agent/extension.id` exist in the slot directory, or pass `--cdp-port 6668` CLI flag.

### 5.11 `validate-recipe.sh` — CLI Wrapper

```bash
#!/usr/bin/env bash
# Usage: bash validate-recipe.sh <recipe.json> [--dry-run] [--step <id>] [--param key=val]
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RECIPE="${1:?Usage: validate-recipe.sh <recipe.json> [options]}"
shift
exec npx tsx "$SCRIPT_DIR/validate-recipe.ts" --recipe "$RECIPE" "$@"
```

---

## 6. Farmslot Runtime — How the Worker Validates

When dispatched as a farmslot worker, the browser is **already running** with MetaMask loaded. The preflight script handles cleanup, webpack watch, and browser launch before the worker starts.

### 6.1 What's Already Running

| Component | State |
|-----------|-------|
| Webpack watch (`yarn start`) | Live rebuild on file save — code changes auto-compile |
| Playwright Chromium | Listening on CDP port `6668`. MetaMask loaded, wallet pre-onboarded |
| State injection | CDP-injected chrome.storage.local state + wallet unlock |

PID files in `.agent/`: `browser.pid`, `extension.id`, `webpack.pid`.

### 6.2 MCP Server — Worker Interface

The MCP server is configured in `.claude/mcp.json` and starts automatically when Claude Code launches. It provides the `mm_*` tools. This is the primary interface for workers — call the tools directly, do not run scripts.

**Quick validation pattern:**
```
mm_describe_screen                                         # full UI snapshot
mm_navigate { screen: "home" }                            # navigate
mm_click { testId: "send-button" }                        # interact
mm_wait_for { testId: "confirm-button", timeoutMs: 10000 } # wait
mm_screenshot { name: "after-my-change" }                 # evidence
mm_get_state                                               # inspect state
```

**Multi-tab confirmation flow:**
```
mm_navigate { screen: "url", url: "http://localhost:54321" }  # open dapp
mm_click { testId: "connect-wallet" }
mm_wait_for_notification { timeoutMs: 15000 }
mm_switch_to_tab { role: "notification" }
mm_click { testId: "confirm-btn" }
mm_switch_to_tab { role: "extension" }
```

### 6.3 After Code Changes

Webpack watch mode rebuilds on save. After editing source files: wait a few seconds for rebuild, then `mm_navigate { screen: "home" }` to force a fresh page load. Check `.agent/webpack.log` for build status if unsure.

---

## 7. Design Constraints

1. **Zero LLM calls at runtime** — pure script execution, fully deterministic
2. **Same JSON format** — mobile recipes work on extension where actions overlap. `ext_` actions are additive.
3. **Direct imports** — call `@metamask/client-mcp-core` handlers via `callHandler()`. No MCP stdio subprocess.
4. **Assertion parity** — identical 8 operators + dot-path field extraction. `lib/assert.ts` is a verbatim port.
5. **Batch optimization** — group consecutive non-asserting steps into `mm_run_steps` for fewer round-trips.
6. **LavaMoat safe** — NEVER use `setInterval`/`setTimeout` in `page.evaluate()` on extension pages. Use service worker page.
7. **Attached mode** — CDP connection via `bootstrapCdpSession(6668)`. Skip launch/cleanup.
8. **Service worker eval** — escape hatch for `eval_sync`/`eval_async`. Access via `chrome-extension://<ID>/service_worker.html`.
9. **Multi-tab awareness** — recipes triggering notification popups must `ext_switch_tab`/`mm_switch_to_tab` to the notification page.
10. **No fallbacks** — fail hard on the happy path so root causes get fixed. Degraded paths hide problems.

---

## 8. Starter Flow Examples

### 8.1 Unlock Wallet (`teams/extension-core/flows/unlock-wallet.json`)

```json
{
  "title": "Unlock wallet with default password",
  "validate": {
    "runtime": {
      "steps": [
        { "id": "wait-unlock-page", "action": "wait_for", "test_id": "unlock-page", "timeout_ms": 10000 },
        { "id": "type-password", "action": "set_input", "test_id": "unlock-password", "value": "correct horse battery staple" },
        { "id": "press-unlock", "action": "press", "test_id": "unlock-submit" },
        { "id": "wait-home", "action": "wait_for", "test_id": "account-overview", "timeout_ms": 15000,
          "assert": { "operator": "not_null" } }
      ]
    }
  }
}
```

### 8.2 Navigate to Perps Tab (`teams/perps/flows/navigate-perps-tab.json`)

```json
{
  "title": "Navigate to Perps Tab",
  "inputs": {},
  "validate": {
    "runtime": {
      "pre_conditions": ["wallet.unlocked", "perps.tab_visible"],
      "steps": [
        { "id": "go-home", "action": "ext_navigate_hash", "hash": "" },
        { "id": "wait-perps-tab", "action": "wait_for", "test_id": "account-overview__perps-tab", "timeout_ms": 10000,
          "assert": { "operator": "not_null" } },
        { "id": "press-perps-tab", "action": "press", "test_id": "account-overview__perps-tab" },
        { "id": "screenshot", "action": "screenshot", "filename": "perps-tab-open" }
      ]
    }
  }
}
```

### 8.3 Composite Flow with `flow_ref`

```json
{
  "title": "Open Long Position",
  "inputs": {
    "amount": { "type": "string", "default": "0.01", "description": "Amount to open" }
  },
  "validate": {
    "runtime": {
      "steps": [
        { "id": "unlock", "action": "flow_ref", "ref": "extension-core/unlock-wallet" },
        { "id": "nav-perps", "action": "flow_ref", "ref": "perps/navigate-perps-tab" },
        { "id": "type-amount", "action": "set_input", "test_id": "perps-amount-input", "value": "{{amount}}" },
        { "id": "press-long", "action": "press", "test_id": "perps-long-button" },
        { "id": "wait-confirm", "action": "wait_for", "test_id": "perps-confirm-modal", "timeout_ms": 5000,
          "assert": { "operator": "not_null" } },
        { "id": "screenshot", "action": "screenshot", "filename": "long-position-confirm" }
      ]
    }
  }
}
```

### 8.4 Dapp Interaction with Tab Switching

```json
{
  "title": "Connect to dapp and approve",
  "inputs": {
    "dappUrl": { "type": "string", "default": "http://localhost:8080" }
  },
  "validate": {
    "runtime": {
      "pre_conditions": ["wallet.unlocked"],
      "steps": [
        { "id": "open-dapp", "action": "navigate", "target": "url", "params": { "url": "{{dappUrl}}" } },
        { "id": "click-connect", "action": "press", "test_id": "connect-wallet" },
        { "id": "wait-notification", "action": "wait_for", "test_id": "page-container-footer-next", "timeout_ms": 15000 },
        { "id": "switch-to-notification", "action": "ext_switch_tab", "role": "notification" },
        { "id": "approve", "action": "press", "test_id": "page-container-footer-next" },
        { "id": "switch-back", "action": "ext_switch_tab", "role": "extension" },
        { "id": "screenshot", "action": "screenshot", "filename": "dapp-connected" }
      ]
    }
  }
}
```

---

## 9. File References

### Extension Repo (`metamask-extension-1/`)

**Recipe system — all files already exist:**

| File | Purpose |
|------|---------|
| `test/e2e/playwright/llm-workflow/recipes/validate-recipe.ts` | Main runner — parse, bootstrap, execute, assert |
| `test/e2e/playwright/llm-workflow/recipes/validate-recipe.sh` | Bash CLI wrapper (`exec npx tsx validate-recipe.ts`) |
| `test/e2e/playwright/llm-workflow/recipes/check-extension.ts` | Diagnostic: CDP attach on port 6668, check perps tab, print build globals (`PERPS_ENABLED`, `MM_PERPS_ENABLED`) |
| `test/e2e/playwright/llm-workflow/recipes/lib/assert.ts` | 8-operator assertion engine with dot-path extraction |
| `test/e2e/playwright/llm-workflow/recipes/lib/action-mapper.ts` | Recipe step → tool handler mapping for all 22 actions |
| `test/e2e/playwright/llm-workflow/recipes/lib/route-map.ts` | Mobile route names → extension URL hashes |
| `test/e2e/playwright/llm-workflow/recipes/lib/session-bootstrap.ts` | `bootstrapSession()` (E2E) + `bootstrapCdpSession(port)` (attached) |
| `test/e2e/playwright/llm-workflow/recipes/lib/pre-condition-runner.ts` | Pre-condition registry loading + evaluation |
| `test/e2e/playwright/llm-workflow/recipes/lib/eval-engine.ts` | `eval_ref` resolution + service worker eval |
| `test/e2e/playwright/llm-workflow/recipes/lib/template.ts` | `{{param}}` 3-pass substitution |
| `test/e2e/playwright/llm-workflow/recipes/lib/cdp-session-manager.ts` | `CdpSessionManager` — `ISessionManager` for attached CDP mode |
| `test/e2e/playwright/llm-workflow/recipes/schemas/flow.schema.json` | JSON schema for recipe validation |
| `test/e2e/playwright/llm-workflow/recipes/teams/extension-core/pre-conditions.ts` | `wallet.unlocked`, `extension.loaded`, `ext.element_visible`, `ext.on_screen` |
| `test/e2e/playwright/llm-workflow/recipes/teams/perps/pre-conditions.ts` | `perps.tab_visible`, `perps.on_market` |
| `test/e2e/playwright/llm-workflow/recipes/teams/*/flows/*.json` | Starter flow files |

**Extension MCP system:**

| File | Purpose |
|------|---------|
| `test/e2e/playwright/llm-workflow/mcp-server/server.ts` | MCP server init — reference bootstrap pattern |
| `test/e2e/playwright/llm-workflow/mcp-server/metamask-provider.ts` | `metaMaskSessionManager` — full E2E session lifecycle |
| `test/e2e/playwright/llm-workflow/capabilities/factory.ts` | `createMetaMaskE2EContext()` — context creation |
| `test/e2e/playwright/llm-workflow/capabilities/state-snapshot.ts` | `ExtensionState` extraction |
| `test/e2e/playwright/llm-workflow/fixture-helper.ts` | `buildDefaultFixture()`, `FixturePresets` |
| `ui/selectors/perps/feature-flags.ts` | `getIsPerpsExperienceAvailable` selector — compile-time + remote flag logic |
| `shared/lib/environment.ts` | `getIsPerpsIncludedInBuild()` — compile-time perps flag |
| `node_modules/@metamask/client-mcp-core/` | Core package — all tool handlers, types, registry |

### Farmslot Integration

| File | Purpose |
|------|---------|
| `farmslot/projects/metamask-extension-farm/project.json` | Extension project config — preflight, health checks |
| `.agent/browser.pid` | Running Chromium PID (per-slot) |
| `.agent/extension.id` | Extension ID (per-slot) |
| `.agent/webpack.pid` | Webpack watcher PID |
| `.agent/webpack.log` | Webpack build output |
| `.agent/wallet-fixture.json` | Wallet credentials (password, address, vault) |

### Mobile Recipe System (reference for format)

| File | Purpose |
|------|---------|
| `metamask-mobile-1/scripts/perps/agentic/schemas/flow.schema.json` | Complete JSON schema (origin of `schemas/flow.schema.json`) |
| `metamask-mobile-1/scripts/perps/agentic/validate-recipe.sh` | Original runner (~1000 lines bash) |
| `metamask-mobile-1/scripts/perps/agentic/lib/assert.js` | Original assertion engine (38 lines — ported verbatim) |
| `metamask-mobile-1/scripts/perps/agentic/teams/perps/pre-conditions.js` | Mobile pre-condition registry |
| `metamask-mobile-1/scripts/perps/agentic/teams/perps/flows/*.json` | Mobile flow files (reference format) |
