# SPEC — MetaMask Visual Testing MCP Server + Knowledge Store (v1)

This spec defines an MCP server that enables LLM agents to **build, launch, interact with, and visually validate** the MetaMask Extension in a real headed Chrome browser.

It also defines a **persistent per-repo learning system** (“knowledge store”) that records dynamic UI discovery outputs (trimmed accessibility snapshot + visible `data-testid`s + screen state) to stay robust under high code churn.

---

## 0) Scope

### In scope (v1)

- Local dev machines only (no CI requirements).
- MCP server over stdio using `@modelcontextprotocol/sdk` (dev dependency).
- Deterministic build using `yarn build:test`.
- Session lifecycle: Anvil + fixture server + Chrome extension via Playwright persistent context (reusing the existing launcher).
- Agent primitives:
  - Build / launch / cleanup
  - State inspection
  - Navigation + notification popup wait
  - Interaction via `data-testid` **or** accessibility `ref`s
  - Dynamic discovery:
    - trimmed accessibility snapshot (actionable/important nodes only)
    - list visible `data-testid`s
- Per-repo knowledge store:
  - records step metadata + discovery snapshots
  - **screenshots are opt-in** (not captured or stored by default)

### Not in scope (v1)

- `yarn start:test` watcher support (long-running build loop).
- Shared/global knowledge cache (future).
- Visual regression diffs (future).
- Full deterministic mocking of extension network traffic (future; may be added later).

---

## 1) Existing foundation (must be reused)

Do not build a second launcher. Reuse the existing Playwright LLM workflow as the engine:

- Exports: `test/e2e/playwright/llm-workflow/index.ts`
- Launcher: `test/e2e/playwright/llm-workflow/extension-launcher.ts`
- Types: `test/e2e/playwright/llm-workflow/types.ts`
- Workflow docs: `test/e2e/playwright/llm-workflow/README.md`
- Multi-window learnings: `test/e2e/playwright/llm-workflow/VISUAL_TESTING_LEARNINGS.md`

The MCP server is an _interface layer_ and a _learning recorder_, not a replacement.

---

## 2) Repository placement + dependency

### Code location (test-only)

- MCP server code lives under: `test/e2e/playwright/llm-workflow/mcp-server/`

### Dependency

Add as dev dependency:

- `@modelcontextprotocol/sdk`

Rationale:

- This is developer tooling only.
- Keeping it under `test/` avoids any chance of bundling into production.

---

## 3) Build strategy (v1)

### Default build: `yarn build:test`

Rationale: deterministic completion. Agents can safely do:

1. `mm_build`
2. `mm_launch`

### Future (v2) note: watch builds

Support `yarn start:test` by adding explicit watcher lifecycle tools:

- `mm_build_watch_start`
- `mm_build_watch_wait_ready`
- `mm_build_watch_stop`

Do not include watch-mode in v1.

---

## 4) MCP server architecture

### Transport

- MCP server over stdio.

### Session model

- Single active session by default (v1).
- The server maintains in-memory:
  - `MetaMaskExtensionLauncher`
  - Playwright `BrowserContext` / `Page`
  - `sessionId`, `extensionId`, ports, runtime metadata

### Screenshot policy

- Screenshots are **never captured automatically**.
- Screenshots are captured only if explicitly requested:
  - `mm_screenshot`
  - `mm_describe_screen({ includeScreenshot: true })`

---

## 5) Dynamic discovery (anti-rot mechanism)

Agents must be able to re-discover flows that change frequently.

### Required discovery outputs

- **Trimmed accessibility snapshot** with deterministic refs (`e1`, `e2`, …).
- Visible `data-testid` inventory.

### Accessibility trimming rules

Keep only nodes whose role is one of:

- Actionable: `button`, `link`, `checkbox`, `radio`, `switch`, `textbox`, `combobox`, `menuitem`
- Important: `dialog`, `alert`, `status`, `heading`

Each returned node includes:

- `ref`: deterministic (`e1`, `e2`, …)
- `role`, `name` (accessible name)
- state flags when available: `disabled`, `checked`, `expanded`
- `path`: minimal ancestry context, e.g. `['dialog:Confirm', 'heading:Send']`

Drop:

- container-only nodes
- deep static text noise

### Deterministic `ref` assignment

- Traverse the trimmed set in stable order (pre-order traversal of the underlying a11y tree).
- Assign refs sequentially: `e1`, `e2`, …

Note: refs are only guaranteed stable _within a single call_ and should be treated as ephemeral selectors.

---

## 6) Knowledge store (per-repo, v1)

### Root

- `test-artifacts/llm-knowledge/`

(`test-artifacts/` is already gitignored.)

### Directory layout

- `test-artifacts/llm-knowledge/<sessionId>/`
  - `steps/`
    - `<timestamp>-<tool>.json`
  - `screenshots/` (opt-in only)
    - `<timestamp>-<name>.png`

### What gets recorded

For these tools, write a StepRecord on every call:

- `mm_launch`
- `mm_get_state`
- `mm_describe_screen`
- `mm_list_testids`
- `mm_accessibility_snapshot`
- `mm_click`
- `mm_type`
- `mm_wait_for`
- `mm_wait_for_notification`
- `mm_screenshot` (records a reference to the artifact; screenshot itself is still explicit)

### Sanitization (required)

- Never store raw typed text for:
  - password fields
  - SRP/seed phrase fields
- For `mm_type`, store:
  - `textRedacted: true`
  - optional `textLength`

---

## 7) MCP tool specs (exact)

### 7.1 Response envelopes

All tools return a JSON object encoded as text.

**Success envelope**

```json
{
  "meta": {
    "timestamp": "2026-01-15T12:34:56.000Z",
    "sessionId": "mm-optional",
    "durationMs": 1234
  },
  "ok": true,
  "result": {}
}
```

**Error envelope**

```json
{
  "error": {
    "code": "MM_ERROR_CODE",
    "message": "Human readable summary",
    "details": {}
  },
  "meta": {
    "timestamp": "2026-01-15T12:34:56.000Z",
    "sessionId": "mm-optional",
    "durationMs": 1234
  },
  "ok": false
}
```

### 7.2 Target selection rule

Tools that act on a UI element accept a target via exactly one of:

- `a11yRef`
- `testId`
- `selector`

If 0 or >1 are provided, return `MM_INVALID_INPUT`.

### 7.3 Tool: `mm_build`

**Input schema**

```json
{
  "additionalProperties": false,
  "properties": {
    "buildType": {
      "type": "string",
      "enum": ["build:test"],
      "default": "build:test"
    },
    "force": { "type": "boolean", "default": false }
  },
  "type": "object"
}
```

**Success result**

```json
{
  "meta": { "timestamp": "...", "durationMs": 1234 },
  "ok": true,
  "result": {
    "buildType": "build:test",
    "extensionPathResolved": "dist/chrome"
  }
}
```

**Error codes**

- `MM_BUILD_FAILED`
- `MM_DEPENDENCIES_MISSING`

### 7.4 Tool: `mm_launch`

**Input schema**

```json
{
  "additionalProperties": false,
  "properties": {
    "autoBuild": { "type": "boolean", "default": true },
    "stateMode": {
      "type": "string",
      "enum": ["default", "onboarding", "custom"],
      "default": "default"
    },
    "fixturePreset": {
      "type": "string",
      "minLength": 1,
      "description": "Name of preset (server maps to FixturePresets.*)"
    },
    "fixture": {
      "type": "object",
      "description": "Direct fixture object for stateMode=custom"
    },
    "ports": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "anvil": { "type": "integer", "minimum": 1, "maximum": 65535 },
        "fixtureServer": {
          "type": "integer",
          "minimum": 1,
          "maximum": 65535
        }
      }
    },
    "slowMo": {
      "type": "integer",
      "minimum": 0,
      "maximum": 10000,
      "default": 0
    },
    "extensionPath": { "type": "string" }
  },
  "type": "object"
}
```

**Success result**

```json
{
  "meta": { "timestamp": "...", "sessionId": "mm-...", "durationMs": 1234 },
  "ok": true,
  "result": {
    "sessionId": "mm-...",
    "extensionId": "abc123",
    "state": {
      "isLoaded": true,
      "currentUrl": "chrome-extension://abc123/home.html",
      "extensionId": "abc123",
      "isUnlocked": false,
      "currentScreen": "unlock",
      "accountAddress": null,
      "networkName": null,
      "chainId": null,
      "balance": null
    }
  }
}
```

**Error codes**

- `MM_SESSION_ALREADY_RUNNING`
- `MM_LAUNCH_FAILED`
- `MM_INVALID_CONFIG`
- `MM_PORT_IN_USE`

### 7.5 Tool: `mm_cleanup`

**Input schema**

```json
{
  "additionalProperties": false,
  "properties": {
    "sessionId": { "type": "string" }
  },
  "type": "object"
}
```

**Success result**

```json
{
  "meta": { "timestamp": "...", "sessionId": "mm-...", "durationMs": 1234 },
  "ok": true,
  "result": { "cleanedUp": true }
}
```

### 7.6 Tool: `mm_get_state`

**Input schema**

```json
{ "additionalProperties": false, "properties": {}, "type": "object" }
```

**Success result**

```json
{
  "meta": { "timestamp": "...", "sessionId": "mm-...", "durationMs": 1234 },
  "ok": true,
  "result": {
    "state": {
      "isLoaded": true,
      "currentUrl": "...",
      "extensionId": "...",
      "isUnlocked": true,
      "currentScreen": "home",
      "accountAddress": "0x...",
      "networkName": "Localhost 8545",
      "chainId": 1337,
      "balance": "25 ETH"
    }
  }
}
```

**Error codes**

- `MM_NO_ACTIVE_SESSION`

### 7.7 Tool: `mm_navigate`

**Input schema**

```json
{
  "additionalProperties": false,
  "properties": {
    "screen": {
      "type": "string",
      "enum": ["home", "settings", "notification", "url"]
    },
    "url": { "type": "string", "minLength": 1 }
  },
  "required": ["screen"],
  "type": "object"
}
```

**Error codes**

- `MM_NAVIGATION_FAILED`
- `MM_NO_ACTIVE_SESSION`
- `MM_INVALID_INPUT`

### 7.8 Tool: `mm_wait_for_notification`

**Input schema**

```json
{
  "additionalProperties": false,
  "properties": {
    "timeoutMs": {
      "type": "integer",
      "minimum": 1000,
      "maximum": 60000,
      "default": 15000
    }
  },
  "type": "object"
}
```

**Error codes**

- `MM_NOTIFICATION_TIMEOUT`
- `MM_NO_ACTIVE_SESSION`

### 7.9 Tool: `mm_list_testids`

**Input schema**

```json
{
  "additionalProperties": false,
  "properties": {
    "limit": { "type": "integer", "minimum": 1, "maximum": 500, "default": 150 }
  },
  "type": "object"
}
```

**Success result**

```json
{
  "meta": { "timestamp": "...", "sessionId": "mm-...", "durationMs": 1234 },
  "ok": true,
  "result": {
    "items": [
      {
        "testId": "confirm-footer-button",
        "tag": "button",
        "text": "Confirm",
        "visible": true
      }
    ]
  }
}
```

### 7.10 Tool: `mm_accessibility_snapshot` (trimmed)

**Input schema**

```json
{
  "additionalProperties": false,
  "properties": {
    "rootSelector": { "type": "string", "minLength": 1 }
  },
  "type": "object"
}
```

**Success result**

```json
{
  "meta": { "timestamp": "...", "sessionId": "mm-...", "durationMs": 1234 },
  "ok": true,
  "result": {
    "nodes": [
      {
        "ref": "e1",
        "role": "dialog",
        "name": "Confirm",
        "disabled": false,
        "path": ["dialog:Confirm"]
      },
      {
        "ref": "e2",
        "role": "button",
        "name": "Confirm",
        "disabled": false,
        "path": ["dialog:Confirm"]
      }
    ]
  }
}
```

### 7.11 Tool: `mm_describe_screen`

**Input schema**

```json
{
  "additionalProperties": false,
  "properties": {
    "includeScreenshot": { "type": "boolean", "default": false },
    "screenshotName": { "type": "string", "minLength": 1 },
    "includeScreenshotBase64": { "type": "boolean", "default": false }
  },
  "type": "object"
}
```

**Success result (default: no screenshot)**

```json
{
  "meta": { "timestamp": "...", "sessionId": "mm-...", "durationMs": 1234 },
  "ok": true,
  "result": {
    "state": { "...": "ExtensionState" },
    "testIds": {
      "items": [
        { "testId": "foo", "tag": "button", "text": "Send", "visible": true }
      ]
    },
    "a11y": {
      "nodes": [
        {
          "ref": "e1",
          "role": "button",
          "name": "Send",
          "disabled": false,
          "path": []
        }
      ]
    },
    "screenshot": null
  }
}
```

If `includeScreenshot=true`, then:

```json
{
  "base64": null,
  "height": 800,
  "path": "test-artifacts/screenshots/...png",
  "width": 1280
}
```

### 7.12 Tool: `mm_screenshot`

**Input schema**

```json
{
  "additionalProperties": false,
  "properties": {
    "name": { "type": "string", "minLength": 1 },
    "fullPage": { "type": "boolean", "default": true },
    "selector": { "type": "string", "minLength": 1 },
    "includeBase64": { "type": "boolean", "default": false }
  },
  "required": ["name"],
  "type": "object"
}
```

### 7.13 Tool: `mm_click`

**Input schema**

```json
{
  "additionalProperties": false,
  "properties": {
    "a11yRef": { "type": "string", "pattern": "^e[0-9]+$" },
    "testId": { "type": "string", "minLength": 1 },
    "selector": { "type": "string", "minLength": 1 },
    "timeoutMs": {
      "type": "integer",
      "minimum": 0,
      "maximum": 60000,
      "default": 30000
    }
  },
  "type": "object"
}
```

**Error codes**

- `MM_INVALID_INPUT`
- `MM_TARGET_NOT_FOUND`
- `MM_CLICK_FAILED`

### 7.14 Tool: `mm_type`

**Input schema**

```json
{
  "additionalProperties": false,
  "properties": {
    "a11yRef": { "type": "string", "pattern": "^e[0-9]+$" },
    "testId": { "type": "string", "minLength": 1 },
    "selector": { "type": "string", "minLength": 1 },
    "text": { "type": "string" },
    "timeoutMs": {
      "type": "integer",
      "minimum": 0,
      "maximum": 60000,
      "default": 30000
    }
  },
  "required": ["text"],
  "type": "object"
}
```

**Logging rule**

- Store `textRedacted=true` for sensitive inputs; never store raw secrets.

**Error codes**

- `MM_INVALID_INPUT`
- `MM_TARGET_NOT_FOUND`
- `MM_TYPE_FAILED`

### 7.15 Tool: `mm_wait_for`

**Input schema**

```json
{
  "additionalProperties": false,
  "properties": {
    "a11yRef": { "type": "string", "pattern": "^e[0-9]+$" },
    "testId": { "type": "string", "minLength": 1 },
    "selector": { "type": "string", "minLength": 1 },
    "timeoutMs": {
      "type": "integer",
      "minimum": 100,
      "maximum": 120000,
      "default": 30000
    }
  },
  "type": "object"
}
```

**Error codes**

- `MM_INVALID_INPUT`
- `MM_WAIT_TIMEOUT`

### 7.16 Tool: `mm_knowledge_last`

**Input schema**

```json
{
  "additionalProperties": false,
  "properties": {
    "n": { "type": "integer", "minimum": 1, "maximum": 200, "default": 20 }
  },
  "type": "object"
}
```

### 7.17 Tool: `mm_knowledge_search`

**Input schema**

```json
{
  "additionalProperties": false,
  "properties": {
    "query": { "type": "string", "minLength": 1, "maxLength": 200 },
    "limit": { "type": "integer", "minimum": 1, "maximum": 100, "default": 20 }
  },
  "required": ["query"],
  "type": "object"
}
```

### 7.18 Tool: `mm_knowledge_summarize`

**Input schema**

```json
{
  "additionalProperties": false,
  "properties": {
    "sessionId": { "type": "string" }
  },
  "type": "object"
}
```

---

## 8) StepRecord JSON Schema v1

### File naming

- `test-artifacts/llm-knowledge/<sessionId>/steps/<timestamp>-<tool>.json`
- `timestamp` should be ISO-like but filesystem safe (example: `20260115T123456.789Z`).

### JSON Schema (draft-07)

```json
{
  "$id": "mm/knowledge/StepRecord.v1.schema.json",
  "$schema": "http://json-schema.org/draft-07/schema#",
  "additionalProperties": false,
  "definitions": {
    "ScreenName": {
      "type": "string",
      "enum": [
        "unlock",
        "home",
        "onboarding-welcome",
        "onboarding-import",
        "onboarding-create",
        "onboarding-srp",
        "onboarding-password",
        "onboarding-complete",
        "onboarding-metametrics",
        "settings",
        "unknown"
      ]
    },

    "ExtensionState": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "isLoaded",
        "currentUrl",
        "extensionId",
        "isUnlocked",
        "currentScreen"
      ],
      "properties": {
        "isLoaded": { "type": "boolean" },
        "currentUrl": { "type": "string" },
        "extensionId": { "type": "string" },
        "isUnlocked": { "type": "boolean" },
        "currentScreen": { "$ref": "#/definitions/ScreenName" },
        "accountAddress": { "type": ["string", "null"] },
        "networkName": { "type": ["string", "null"] },
        "chainId": { "type": ["integer", "null"] },
        "balance": { "type": ["string", "null"] }
      }
    },

    "TestIdItem": {
      "type": "object",
      "additionalProperties": false,
      "required": ["testId", "tag", "visible"],
      "properties": {
        "testId": { "type": "string" },
        "tag": { "type": "string" },
        "text": { "type": "string" },
        "visible": { "type": "boolean" }
      }
    },

    "A11yNodeTrimmed": {
      "type": "object",
      "additionalProperties": false,
      "required": ["ref", "role", "name", "path"],
      "properties": {
        "ref": { "type": "string", "pattern": "^e[0-9]+$" },
        "role": { "type": "string" },
        "name": { "type": "string" },
        "disabled": { "type": "boolean" },
        "checked": { "type": "boolean" },
        "expanded": { "type": "boolean" },
        "path": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Minimal ancestry context, e.g. dialog/heading labels"
        }
      }
    }
  },
  "properties": {
    "schemaVersion": { "type": "integer", "const": 1 },
    "timestamp": { "type": "string", "format": "date-time" },
    "sessionId": { "type": "string", "minLength": 4 },

    "environment": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "platform": { "type": "string" },
        "nodeVersion": { "type": "string" },
        "yarnVersion": { "type": "string" }
      }
    },

    "git": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "branch": { "type": "string" },
        "commit": { "type": "string" },
        "dirty": { "type": "boolean" }
      }
    },

    "build": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "buildType": { "type": "string", "enum": ["build:test"] },
        "extensionPathResolved": { "type": "string" }
      }
    },

    "tool": {
      "type": "object",
      "additionalProperties": false,
      "required": ["name"],
      "properties": {
        "name": { "type": "string", "minLength": 1 },
        "input": {
          "type": "object",
          "description": "Sanitized tool input. Never store secrets."
        },
        "target": {
          "type": "object",
          "additionalProperties": false,
          "properties": {
            "selector": { "type": "string" },
            "testId": { "type": "string" },
            "a11yRef": { "type": "string", "pattern": "^e[0-9]+$" }
          }
        },
        "textRedacted": {
          "type": "boolean",
          "description": "True when tool input included sensitive typed text that was redacted."
        },
        "textLength": {
          "type": "integer",
          "minimum": 0,
          "description": "Optional: length of redacted text."
        }
      }
    },

    "timing": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "durationMs": { "type": "integer", "minimum": 0 }
      }
    },

    "outcome": {
      "type": "object",
      "additionalProperties": false,
      "required": ["ok"],
      "properties": {
        "ok": { "type": "boolean" },
        "error": {
          "type": "object",
          "additionalProperties": false,
          "properties": {
            "code": { "type": "string" },
            "message": { "type": "string" },
            "details": { "type": "object" }
          }
        }
      }
    },

    "observation": {
      "type": "object",
      "additionalProperties": false,
      "required": ["state", "testIds", "a11y"],
      "properties": {
        "state": { "$ref": "#/definitions/ExtensionState" },
        "testIds": {
          "type": "array",
          "items": { "$ref": "#/definitions/TestIdItem" }
        },
        "a11y": {
          "type": "object",
          "additionalProperties": false,
          "required": ["nodes"],
          "properties": {
            "nodes": {
              "type": "array",
              "items": { "$ref": "#/definitions/A11yNodeTrimmed" }
            }
          }
        }
      }
    },

    "artifacts": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "screenshot": {
          "type": "object",
          "additionalProperties": false,
          "properties": {
            "path": { "type": "string" },
            "width": { "type": "integer", "minimum": 1 },
            "height": { "type": "integer", "minimum": 1 }
          }
        }
      }
    }
  },

  "required": [
    "schemaVersion",
    "timestamp",
    "sessionId",
    "tool",
    "outcome",
    "observation"
  ],
  "title": "MetaMask MCP Knowledge StepRecord v1",
  "type": "object"
}
```

---

## 9) Knowledge tools behavior (v1)

### `mm_knowledge_last`

Returns latest step summaries (compact): timestamp, tool, screen, brief snippet.

### `mm_knowledge_search`

Searches across StepRecord JSON for:

- tool names
- screen names
- testIds
- accessibility names/roles

### `mm_knowledge_summarize`

Produces a recipe-like sequence derived from recent steps:

- step number
- tool
- notes derived from target/testIds/a11y names

---

## 10) Implementation checklist

1. Add dev dependency `@modelcontextprotocol/sdk`.
2. Create `test/e2e/playwright/llm-workflow/mcp-server/` entrypoint.
3. Implement session manager (single active session).
4. Implement tool handlers mapping to launcher and Playwright page.
5. Implement discovery:
   - visible `data-testid` inventory
   - trimmed a11y snapshot + deterministic refs
   - `mm_describe_screen` composition
6. Implement StepRecord writer:
   - schemaVersion=1
   - sanitize typed text
   - screenshots opt-in only
7. Implement knowledge query tools.
8. Add connection docs for MCP clients.
9. Local smoke validation:
   - `mm_build` → `mm_launch` → `mm_describe_screen` → `mm_cleanup`

---

## 11) Future work (v2+)

- Support `yarn start:test` via explicit watcher lifecycle tools.
- Add optional global/shared knowledge store backend (reuse StepRecord schema; add sync later).
- Add deterministic request interception for extension traffic (real mocking) if needed.
- Add visual regression diffs as opt-in tooling.
