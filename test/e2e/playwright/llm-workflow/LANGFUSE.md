# Langfuse Tracing

Observability for the MetaMask LLM workflow — traces every tool call, LLM prompt, completion, and token usage to a self-hosted [Langfuse](https://langfuse.svc.consensys.info) instance.

## Overview

Two tracing layers work together:

| Layer | What it captures | Source |
|---|---|---|
| **Daemon hooks** | Every `mm` tool call (click, type, screenshot) with input/output | `langfuse-hooks.ts` via `@langfuse/tracing` |
| **Claude runner** | LLM prompts, completions, token usage, cost, tool calls | `claude-runner.ts` via Claude Agent SDK message stream |

Both share the same Langfuse session ID — all spans appear in a single unified trace.

## Setup

### 1. Create `.env.langfuse`

In the repo root (already gitignored):

```
LANGFUSE_ENABLED=true
LANGFUSE_SECRET_KEY="sk-lf-..."
LANGFUSE_PUBLIC_KEY="pk-lf-..."
LANGFUSE_BASE_URL="https://langfuse.svc.consensys.info"
ANTHROPIC_API_KEY="sk-ant-..."
```

| Variable | Required for | Description |
|---|---|---|
| `LANGFUSE_ENABLED` | Both | Set `true` to enable tracing |
| `LANGFUSE_SECRET_KEY` | Both | Langfuse project secret key |
| `LANGFUSE_PUBLIC_KEY` | Both | Langfuse project public key |
| `LANGFUSE_BASE_URL` | Both | Self-hosted Langfuse URL |
| `ANTHROPIC_API_KEY` | Claude runner only | Anthropic API key for Claude |
| `LANGFUSE_USER_ID` | Optional | Override the default userId (defaults to OS username) |

### 2. Install dependencies

```bash
yarn install
yarn playwright install chromium
```

### 3. Build the extension

```bash
yarn build:test
```

## Usage

### Interactive (daemon-only tracing)

When using `mm` CLI from OpenCode or terminal, tool calls are automatically traced. No extra setup beyond `.env.langfuse`.

```bash
mm launch
mm describe-screen   # → tool:mm_describe_screen span in Langfuse
mm click e3          # → tool:mm_click span in Langfuse
mm cleanup
```

### Automated (Claude runner with full LLM tracing)

For scripted runs where you need prompts, completions, and token usage traced:

```bash
npx tsx test/e2e/playwright/llm-workflow/claude-runner.ts \
  --prompt "Navigate to settings and verify Ethereum Mainnet is listed"
```

The daemon auto-starts if not running. Claude interacts with MetaMask via `mm` CLI commands through Bash.

### Runner options

| Flag | Default | Description |
|---|---|---|
| `--prompt`, `-p` | (required) | Task for Claude to perform |
| `--model`, `-m` | `claude-sonnet-4-6` | Claude model to use |
| `--max-turns` | `50` | Max agent turns before stopping |
| `--redact` | `false` | Strip prompt/completion content from traces |
| `--verbose`, `-v` | `false` | Print Claude's reasoning to stderr |

### Examples

```bash
# Quick test with verbose output
npx tsx test/e2e/playwright/llm-workflow/claude-runner.ts \
  --prompt "Check the account balance on the home screen" \
  --verbose

# Use a different model with more turns
npx tsx test/e2e/playwright/llm-workflow/claude-runner.ts \
  --prompt "Complete the full send flow: send 0.1 ETH to 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" \
  --model claude-sonnet-4-6 \
  --max-turns 80

# Redacted run (no prompt/completion content in Langfuse)
npx tsx test/e2e/playwright/llm-workflow/claude-runner.ts \
  --prompt "Navigate through onboarding" \
  --redact
```

## What appears in Langfuse

A session trace shows the full agent interaction:

```
claude-runner (agent span)
│
├── claude-sonnet-4-6 (generation)
│   input: "Navigate to settings and verify Ethereum Mainnet is listed"
│   output: "I'll start by checking what's on screen..."
│   model: claude-sonnet-4-6
│   tokens: 3 in / 95 out
│
├── tool:Bash (tool span)
│   input: { command: "mm describe-screen" }
│   output: "{ state: { screen: 'home', ... }, a11y: [...] }"
│
├── claude-sonnet-4-6 (generation)
│   input: "[Bash result] { state: { screen: 'home' ... }"
│   output: "I can see the home screen. I'll click Settings..."
│   tokens: 1200 in / 50 out
│
├── tool:Bash (tool span)
│   input: { command: "mm click e5" }
│   output: "Clicked Settings button"
│
├── tool:mm_click (tool span, from daemon hooks)
│   input: { a11yRef: "e5" }
│   output: { clicked: true, target: "Settings" }
│
└── ...
```

## Architecture

```
┌──────────────────────────────────────────────┐
│  claude-runner.ts                            │
│                                              │
│  query({ prompt, options })                  │
│    → spawns Claude Code CLI subprocess       │
│    → iterates SDKMessage stream              │
│    → creates Langfuse spans:                 │
│        generation (per LLM turn)             │
│        tool (per tool_use / tool_result)     │
└──────────────┬───────────────────────────────┘
               │ Claude calls `mm` CLI via Bash
               ▼
┌──────────────────────────────────────────────┐
│  daemon.ts                                   │
│                                              │
│  HTTP daemon (createServer from mcp-core)    │
│  langfuse-hooks.ts:                          │
│    onSessionStart → agent span               │
│    onToolEnd → tool span with input/output   │
│    onToolError → error span                  │
│    onSessionEnd / onServerStop → flush       │
└──────────────┬───────────────────────────────┘
               │ Playwright
               ▼
┌──────────────────────────────────────────────┐
│  Chrome + MetaMask Extension + Anvil         │
└──────────────────────────────────────────────┘

        All spans → same Langfuse session
                       ▼
┌──────────────────────────────────────────────┐
│  Langfuse (self-hosted)                      │
│  https://langfuse.svc.consensys.info         │
└──────────────────────────────────────────────┘
```

### Session ID correlation

The runner fetches the daemon's active session ID via `GET /status` and uses it as the Langfuse `sessionId` for all its spans. This ensures daemon tool spans and runner generation spans appear in the same Langfuse session view.

If no daemon session is active, the runner falls back to the Claude SDK session ID.

## Key files

| File | Purpose |
|---|---|
| `instrumentation.ts` | OTel SDK + `LangfuseSpanProcessor` init, imported by both daemon and runner |
| `langfuse-hooks.ts` | `ToolHooks` implementation — creates Langfuse tool spans for each `mm` tool call |
| `claude-runner.ts` | Standalone script — runs Claude Agent SDK with client-side Langfuse instrumentation |
| `daemon.ts` | HTTP daemon entry point — wires session manager, knowledge store, and Langfuse hooks |
| `.env.langfuse` | Credentials file (gitignored) |

## Sensitive data handling

- Passwords, SRPs, seed phrases, mnemonics, and private keys are redacted from tool span inputs
- Base64 screenshots are replaced with `[REDACTED base64 NKB]`
- Tool results longer than 4000 chars are truncated
- Use `--redact` flag on the runner to strip all prompt/completion content from traces

## Disabling tracing

Set `LANGFUSE_ENABLED=false` in `.env.langfuse` or remove the file entirely. Both the daemon and runner check this flag at startup and skip all tracing when disabled. There is zero performance impact when tracing is off.

## Troubleshooting

| Issue | Fix |
|---|---|
| No traces appearing | Check `LANGFUSE_ENABLED=true` and that public/secret keys are set in `.env.langfuse` |
| Two separate sessions in Langfuse | Restart daemon (`mm cleanup --shutdown && mm launch`) so runner can read the session ID from `/status` |
| Empty input/output on spans | This is expected for Claude CLI native OTel spans — the runner's client-side spans have content |
| Runner fails with "ANTHROPIC_API_KEY required" | Add your Anthropic key to `.env.langfuse` |
| Runner hits max turns | Increase with `--max-turns 100` |
| Daemon not auto-starting | Ensure extension is built: `yarn build:test` |
