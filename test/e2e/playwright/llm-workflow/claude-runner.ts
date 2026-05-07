#!/usr/bin/env node
/**
 * Claude Agent SDK runner with Langfuse tracing.
 *
 * Runs a Claude Code agent that can interact with MetaMask via the `mm` CLI.
 * LLM calls, tool invocations, and token usage are traced to Langfuse via
 * client-side instrumentation using @langfuse/tracing (same as daemon hooks).
 *
 * Prerequisites:
 *   1. Extension built: `yarn build:test` (or `yarn build:test:webpack`)
 *   2. Env file configured: `.env.langfuse` (with ANTHROPIC_API_KEY)
 *
 * The daemon is auto-started if not already running.
 *
 * Usage:
 *   npx tsx test/e2e/playwright/llm-workflow/claude-runner.ts \
 *     --prompt "Navigate to settings and verify Ethereum Mainnet is listed"
 *
 *   npx tsx test/e2e/playwright/llm-workflow/claude-runner.ts \
 *     --prompt "Send 0.1 ETH to 0x1234..." \
 *     --model claude-sonnet-4-6 \
 *     --max-turns 20
 */
import path from 'path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import { config } from 'dotenv';
import { parseArgs } from 'node:util';
import { query, type SDKMessage } from '@anthropic-ai/claude-agent-sdk';
import { readDaemonState, isDaemonAlive } from '@metamask/client-mcp-core';

const repoRoot = (() => {
  let dir = __dirname;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { existsSync, readFileSync } = require('fs');
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const candidate = path.join(dir, 'package.json');
    if (existsSync(candidate)) {
      try {
        const pkg = JSON.parse(readFileSync(candidate, 'utf-8'));
        if (pkg.name === 'metamask-crx') return dir;
      } catch {
        /* keep walking */
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) return process.cwd();
    dir = parent;
  }
})();

config({ path: path.join(repoRoot, '.env.langfuse') });

const { values: args } = parseArgs({
  options: {
    prompt: { type: 'string', short: 'p' },
    model: { type: 'string', short: 'm', default: 'claude-sonnet-4-6' },
    'max-turns': { type: 'string', default: '50' },
    redact: { type: 'boolean', default: false },
    verbose: { type: 'boolean', short: 'v', default: false },
  },
  strict: true,
});

if (!args.prompt) {
  process.stderr.write(
    'Usage: claude-runner.ts --prompt "your task description"\n',
  );
  process.exit(1);
}

const LANGFUSE_PUBLIC_KEY = process.env.LANGFUSE_PUBLIC_KEY;
const LANGFUSE_SECRET_KEY = process.env.LANGFUSE_SECRET_KEY;
const LANGFUSE_BASE_URL = process.env.LANGFUSE_BASE_URL;
const LANGFUSE_ENABLED = process.env.LANGFUSE_ENABLED === 'true';

if (!process.env.ANTHROPIC_API_KEY) {
  process.stderr.write(
    'Error: ANTHROPIC_API_KEY is required. Set it in .env.langfuse or as an env var.\n',
  );
  process.exit(1);
}

// ── Langfuse client-side tracing ────────────────────────────────────────────
// Claude CLI's native OTel produces spans without input/output content.
// Instead, we capture prompts/completions from the SDK message stream and
// create proper Langfuse generation spans using @langfuse/tracing.

import { langfuseProcessor, otelSdk } from './instrumentation';
import { startObservation, propagateAttributes } from '@langfuse/tracing';

type SpanHandle = {
  update: (attrs: Record<string, unknown>) => SpanHandle;
  end: () => void;
  startObservation: (
    name: string,
    attrs?: Record<string, unknown>,
    opts?: Record<string, unknown>,
  ) => SpanHandle;
};

function resolveUserId(): string {
  return process.env.LANGFUSE_USER_ID ?? os.userInfo().username;
}

function extractTextContent(message: Record<string, unknown>): string {
  const content = message?.content;
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  const parts: string[] = [];
  for (const block of content) {
    if (
      typeof block === 'object' &&
      block !== null &&
      'type' in block &&
      block.type === 'text' &&
      'text' in block
    ) {
      parts.push(block.text as string);
    }
  }
  return parts.join('\n');
}

function extractToolUseBlocks(
  message: Record<string, unknown>,
): Array<{ id: string; name: string; input: unknown }> {
  const content = message?.content;
  if (!Array.isArray(content)) return [];
  const tools: Array<{ id: string; name: string; input: unknown }> = [];
  for (const block of content) {
    if (
      typeof block === 'object' &&
      block !== null &&
      'type' in block &&
      block.type === 'tool_use' &&
      'name' in block &&
      'id' in block
    ) {
      tools.push({
        id: block.id as string,
        name: block.name as string,
        input: 'input' in block ? block.input : undefined,
      });
    }
  }
  return tools;
}

const METAMASK_SYSTEM_PROMPT = `You are an automated testing agent for the MetaMask browser extension.
You interact with MetaMask through the \`mm\` CLI tool.

Available commands (run via Bash):
  mm describe-screen          # See current screen state and element references
  mm click <ref>              # Click an element (e.g., mm click e3)
  mm type <ref> "text"        # Type into an input (e.g., mm type e5 "0x1234...")
  mm screenshot --name <name> # Take a screenshot
  mm wait-for <ref>           # Wait for an element to appear
  mm navigate-home            # Go to wallet home
  mm navigate-settings        # Go to settings
  mm get-state                # Get current extension state

Workflow:
1. Always start with \`mm describe-screen\` to see what's on screen
2. Use the a11y refs (e1, e2, ...) from describe-screen to interact
3. After each action, call \`mm describe-screen\` again to verify the result
4. Take screenshots at key moments for evidence

Important:
- Refs like e1, e2 are ephemeral — always get fresh refs via describe-screen before interacting
- The extension default password is: correct horse battery staple
- Be methodical: observe → act → verify`;

async function ensureDaemon(): Promise<number> {
  const state = await readDaemonState(repoRoot);
  if (state && (await isDaemonAlive(state))) {
    process.stderr.write(
      `[RUNNER] Daemon already running on port ${state.port}\n`,
    );
    return state.port;
  }

  process.stderr.write(
    '[RUNNER] Daemon not running — starting via mm launch\n',
  );
  try {
    execSync('npx mm launch --state default --force', {
      cwd: repoRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 120_000,
    });
    process.stderr.write('[RUNNER] Daemon + browser session started\n');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`[RUNNER] Failed to start daemon: ${msg}\n`);
    process.exit(1);
  }

  const newState = await readDaemonState(repoRoot);
  return newState?.port ?? 0;
}

async function getDaemonSessionId(port: number): Promise<string | undefined> {
  if (!port) return undefined;
  try {
    const resp = await fetch(`http://127.0.0.1:${port}/status`);
    const data = (await resp.json()) as {
      session?: { active: boolean; id: string | null };
    };
    return data.session?.id ?? undefined;
  } catch {
    return undefined;
  }
}

async function run(): Promise<void> {
  const daemonPort = await ensureDaemon();
  const daemonSessionId = await getDaemonSessionId(daemonPort);

  const maxTurns = parseInt(args['max-turns'] ?? '25', 10);
  const startTime = Date.now();
  const userId = resolveUserId();
  const redact = args.redact ?? false;

  if (daemonSessionId) {
    process.stderr.write(
      `[RUNNER] Daemon session: ${daemonSessionId} (reusing for Langfuse)\n`,
    );
  }

  process.stderr.write(`\n[RUNNER] Prompt: ${args.prompt}\n`);
  process.stderr.write(`[RUNNER] Model: ${args.model}\n`);
  process.stderr.write(`[RUNNER] Max turns: ${maxTurns}\n\n`);

  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let turns = 0;
  let finalResult: string | undefined;
  let langfuseSessionId: string | undefined = daemonSessionId;
  let sessionSpan: SpanHandle | undefined;
  let lastTurnInput: string = args.prompt!;

  // Track pending tool calls: tool_use_id → { name, input, span }
  const pendingTools = new Map<
    string,
    { name: string; input: unknown; span: SpanHandle }
  >();

  for await (const message of query({
    prompt: args.prompt!,
    options: {
      model: args.model,
      maxTurns,
      cwd: repoRoot,
      permissionMode: 'bypassPermissions',
      allowDangerouslySkipPermissions: true,
      systemPrompt: METAMASK_SYSTEM_PROMPT,

      // options.env replaces process.env entirely — always spread first
      env: {
        ...process.env,
      },

      ...(args.verbose
        ? { stderr: (data: string) => process.stderr.write(data) }
        : {}),
    },
  })) {
    handleMessage(message);
  }

  for (const [, pending] of pendingTools) {
    pending.span.update({ output: '[no result received]' });
    pending.span.end();
  }
  pendingTools.clear();

  if (sessionSpan) {
    sessionSpan.update({
      output: {
        status: finalResult ? 'completed' : 'failed',
        result: finalResult?.slice(0, 1000),
        totalInputTokens,
        totalOutputTokens,
        turns,
      },
    });
    sessionSpan.end();
  }

  if (langfuseProcessor) {
    await langfuseProcessor.forceFlush();
  }

  function traceSpan(fn: () => void): void {
    if (!langfuseProcessor || !langfuseSessionId) return;
    try {
      propagateAttributes({ sessionId: langfuseSessionId, userId }, fn);
    } catch {
      /* fire-and-forget */
    }
  }

  function setOtelAttrs(
    span: SpanHandle,
    attrs: Record<string, string | number>,
  ): void {
    const otel = (
      span as unknown as {
        otelSpan?: { setAttribute(k: string, v: string | number): void };
      }
    ).otelSpan;
    if (!otel) return;
    for (const [k, v] of Object.entries(attrs)) {
      otel.setAttribute(k, v);
    }
  }

  function handleMessage(message: SDKMessage): void {
    switch (message.type) {
      case 'system':
        if ('subtype' in message && message.subtype === 'init') {
          const claudeSessionId = message.session_id;
          if (!langfuseSessionId) {
            langfuseSessionId = claudeSessionId;
          }
          process.stderr.write(
            `[RUNNER] Claude session: ${claudeSessionId}\n`,
          );
          process.stderr.write(
            `[RUNNER] Langfuse session: ${langfuseSessionId}\n`,
          );

          traceSpan(() => {
            sessionSpan = startObservation(
              `claude-runner`,
              {
                input: redact ? '[REDACTED]' : args.prompt,
                metadata: {
                  model: args.model,
                  maxTurns,
                  claudeSessionId,
                  langfuseSessionId,
                },
              },
              { asType: 'agent' },
            ) as unknown as SpanHandle;
          });
        }
        break;

      case 'assistant': {
        turns++;
        const msg = message as SDKMessage & {
          type: 'assistant';
          message: {
            model?: string;
            usage?: {
              input_tokens?: number;
              output_tokens?: number;
              cache_read_input_tokens?: number;
              cache_creation_input_tokens?: number;
            };
            content?: unknown[];
            stop_reason?: string;
          };
        };

        const usage = msg.message?.usage;
        if (usage) {
          totalInputTokens += usage.input_tokens ?? 0;
          totalOutputTokens += usage.output_tokens ?? 0;
        }

        const textContent = extractTextContent(
          msg.message as unknown as Record<string, unknown>,
        );
        const toolUses = extractToolUseBlocks(
          msg.message as unknown as Record<string, unknown>,
        );

        if (args.verbose && textContent) {
          process.stderr.write(`[CLAUDE] ${textContent}\n`);
        }

        const modelName = msg.message?.model ?? args.model ?? 'unknown';

        traceSpan(() => {
          const parent = sessionSpan;
          if (!parent) return;

          const genSpan = parent.startObservation(
            modelName,
            {
              input: redact ? '[REDACTED]' : lastTurnInput,
              output: redact
                ? '[REDACTED]'
                : textContent || JSON.stringify(toolUses),
            },
            { asType: 'generation' },
          );

          setOtelAttrs(genSpan, {
            'langfuse.observation.model.name': modelName,
            ...(usage
              ? {
                  'gen_ai.usage.input_tokens': usage.input_tokens ?? 0,
                  'gen_ai.usage.output_tokens': usage.output_tokens ?? 0,
                  ...(usage.cache_read_input_tokens
                    ? {
                        'gen_ai.usage.cache_read_input_tokens':
                          usage.cache_read_input_tokens,
                      }
                    : {}),
                  ...(usage.cache_creation_input_tokens
                    ? {
                        'gen_ai.usage.cache_creation_input_tokens':
                          usage.cache_creation_input_tokens,
                      }
                    : {}),
                }
              : {}),
          });

          genSpan.end();

          for (const tool of toolUses) {
            if (!tool.id) continue;
            const toolSpan = parent.startObservation(
              `tool:${tool.name}`,
              { input: redact ? '[REDACTED]' : tool.input },
              { asType: 'tool' },
            );
            pendingTools.set(tool.id, {
              name: tool.name,
              input: tool.input,
              span: toolSpan,
            });
          }
        });
        break;
      }

      case 'user': {
        const userMsg = message as SDKMessage & {
          type: 'user';
          message: { content?: unknown[] | string };
        };
        const content = userMsg.message?.content;
        if (!Array.isArray(content)) break;

        for (const block of content) {
          if (
            typeof block !== 'object' ||
            block === null ||
            !('type' in block) ||
            block.type !== 'tool_result' ||
            !('tool_use_id' in block)
          ) {
            continue;
          }

          const toolUseId = block.tool_use_id as string;
          const pending = pendingTools.get(toolUseId);
          if (!pending) continue;

          let resultText: string;
          if ('content' in block && typeof block.content === 'string') {
            resultText = block.content;
          } else if ('content' in block && Array.isArray(block.content)) {
            resultText = (block.content as unknown as Array<Record<string, unknown>>)
              .filter((b) => b.type === 'text' && typeof b.text === 'string')
              .map((b) => b.text as string)
              .join('\n');
          } else {
            resultText = JSON.stringify(block);
          }

          const truncated =
            resultText.length > 4000
              ? `${resultText.slice(0, 4000)}... [truncated ${resultText.length} chars]`
              : resultText;

          pending.span.update({
            output: redact ? '[REDACTED]' : truncated,
            level:
              'is_error' in block && block.is_error ? 'ERROR' : 'DEFAULT',
          });
          pending.span.end();
          pendingTools.delete(toolUseId);

          lastTurnInput = `[${pending.name} result] ${truncated.slice(0, 2000)}`;
        }
        break;
      }

      case 'result': {
        const result = message as SDKMessage & {
          type: 'result';
          subtype: string;
          result?: string;
          total_cost_usd?: number;
          num_turns?: number;
          duration_ms?: number;
        };
        if (result.subtype === 'success') {
          finalResult = result.result;
          const durationSec = (
            (result.duration_ms ?? Date.now() - startTime) /
            1000
          ).toFixed(1);
          process.stderr.write(
            '\n─────────────────────────────────────\n',
          );
          process.stderr.write(
            `[RUNNER] ✓ Completed in ${durationSec}s\n`,
          );
          process.stderr.write(
            `[RUNNER] Turns: ${result.num_turns ?? turns}\n`,
          );
          process.stderr.write(
            `[RUNNER] Tokens: ${totalInputTokens} in / ${totalOutputTokens} out\n`,
          );
          if (result.total_cost_usd !== undefined) {
            process.stderr.write(
              `[RUNNER] Cost: $${result.total_cost_usd.toFixed(4)}\n`,
            );
          }
          process.stderr.write(
            '─────────────────────────────────────\n\n',
          );
          if (finalResult) {
            process.stdout.write(finalResult + '\n');
          }
        } else {
          process.stderr.write(
            `[RUNNER] ✗ Failed: ${result.subtype}\n`,
          );
          if (result.result) {
            process.stderr.write(
              `[RUNNER] Error: ${result.result}\n`,
            );
          }
          process.exitCode = 1;
        }
        break;
      }

      default:
        break;
    }
  }
}

run()
  .catch((error: Error) => {
    process.stderr.write(`[RUNNER] Fatal error: ${error.message}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (otelSdk) {
      await otelSdk.shutdown();
    }
  });
