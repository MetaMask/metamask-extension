# Langfuse Tracing

Observability for the MetaMask LLM workflow — traces every tool call, LLM prompt, completion, and token usage to a self-hosted [Langfuse](https://langfuse.svc.consensys.info) instance.

## Overview

Tracing is handled by the Claude runner (`claude-runner.ts`), which captures LLM prompts, completions, token usage, cost, and tool calls from the Claude Agent SDK message stream. Spans are created using `@langfuse/tracing` and exported via the `LangfuseSpanProcessor` from `@langfuse/otel`.

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

| Variable | Required | Description |
|---|---|---|
| `LANGFUSE_ENABLED` | Yes | Set `true` to enable tracing |
| `LANGFUSE_SECRET_KEY` | Yes | Langfuse project secret key |
| `LANGFUSE_PUBLIC_KEY` | Yes | Langfuse project public key |
| `LANGFUSE_BASE_URL` | Yes | Self-hosted Langfuse URL |
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key (used by both the agent and the LLM-as-a-judge evaluator) |
| `LANGFUSE_USER_ID` | No | Override the default userId (defaults to OS username) |

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

Run Claude against MetaMask with full tracing:

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
├── Bash: mm describe-screen (tool span)
│   input: { command: "mm describe-screen" }
│   output: "{ state: { screen: 'home', ... }, a11y: [...] }"
│
├── claude-sonnet-4-6 (generation)
│   input: "[Bash result] { state: { screen: 'home' ... }"
│   output: "I can see the home screen. I'll click Settings..."
│   tokens: 1200 in / 50 out
│
├── Bash: mm click e5 (tool span)
│   input: { command: "mm click e5" }
│   output: "Clicked Settings button"
│
├── ...
│
└── Scores (from LLM-as-a-judge, posted after run completes)
    task_completion: 0.9 — "Successfully navigated to settings"
    efficiency: 0.8 — "Minimal steps, one extra screenshot"
    correctness: 1.0 — "All actions correct"
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
│    → runs LLM-as-a-judge evaluation          │
│    → posts scores to Langfuse API            │
└──────────────┬───────────────────────────────┘
               │ Claude calls `mm` CLI via Bash
               ▼
┌──────────────────────────────────────────────┐
│  daemon.ts                                   │
│  HTTP daemon (createServer from mcp-core)    │
│  Manages Playwright browser session          │
└──────────────┬───────────────────────────────┘
               │ Playwright
               ▼
┌──────────────────────────────────────────────┐
│  Chrome + MetaMask Extension + Anvil         │
└──────────────────────────────────────────────┘

        All spans → Langfuse
                       ▼
┌──────────────────────────────────────────────┐
│  Langfuse (self-hosted)                      │
│  https://langfuse.svc.consensys.info         │
└──────────────────────────────────────────────┘
```

## LLM-as-a-judge evaluation

After each run, the runner automatically evaluates Claude's performance by calling `claude-sonnet-4-6` as a judge. The judge receives the task prompt, the full conversation transcript, and scores on three dimensions:

| Score | Range | Description |
|---|---|---|
| `task_completion` | 0.0–1.0 | Did the agent complete the requested task? |
| `efficiency` | 0.0–1.0 | How many wasted steps? |
| `correctness` | 0.0–1.0 | Were the agent's actions correct? |

Scores are posted to Langfuse via `POST /api/public/scores` and appear on the trace detail page. Each score includes a brief reasoning comment from the judge.

## Session lifecycle

The runner manages the full lifecycle automatically:

1. **Start**: Checks if daemon is running via `GET /status`, starts it with `mm launch --state default --force` if not
2. **Session ID**: Reads the daemon's active session ID from `/status` and uses it as the Langfuse session ID
3. **Run**: Iterates the Claude Agent SDK message stream, creating Langfuse spans for each generation and tool call
4. **Evaluate**: Calls LLM-as-a-judge and posts scores to Langfuse
5. **Cleanup**: Runs `mm cleanup` to tear down the browser session, then shuts down the OTel SDK

## Key files

| File | Purpose |
|---|---|
| `instrumentation.ts` | OTel SDK + `LangfuseSpanProcessor` init |
| `runner-tracing.ts` | Span helpers: `createSessionSpan`, `traceSpan`, `setOtelAttrs` |
| `runner-message-handler.ts` | SDK message → Langfuse span mapping (generation, tool, result) |
| `runner-eval.ts` | LLM-as-a-judge evaluation + score posting |
| `runner-daemon.ts` | Daemon lifecycle: start, session ID, cleanup |
| `message-parser.ts` | Extract text content and tool use blocks from Claude messages |
| `.env.langfuse` | Credentials file (gitignored) |

## Sensitive data handling

- Tool results longer than 4000 chars are truncated
- Use `--redact` flag on the runner to strip all prompt/completion content from traces

## Disabling tracing

Set `LANGFUSE_ENABLED=false` in `.env.langfuse` or remove the file entirely. The runner checks this flag at startup and skips all tracing when disabled. There is zero performance impact when tracing is off.

## Troubleshooting

| Issue | Fix |
|---|---|
| No traces appearing | Check `LANGFUSE_ENABLED=true` and that public/secret keys are set in `.env.langfuse` |
| Runner fails with "ANTHROPIC_API_KEY required" | Add your Anthropic key to `.env.langfuse` |
| Runner hits max turns | Increase with `--max-turns 100` |
| Daemon not auto-starting | Ensure extension is built: `yarn build:test` |
