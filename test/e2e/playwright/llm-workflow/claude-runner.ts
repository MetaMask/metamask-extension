#!/usr/bin/env node
/**
 * Claude Agent SDK runner with Langfuse tracing.
 *
 * Usage:
 *   npx tsx test/e2e/playwright/llm-workflow/claude-runner.ts \
 *     --prompt "Navigate to settings and verify Ethereum Mainnet is listed"
 */
import path from 'path';
import { parseArgs } from 'node:util';
import { config } from 'dotenv';
import { resolveRepoRoot } from './resolve-repo-root';
import { query } from '@anthropic-ai/claude-agent-sdk';
import { otelSdk } from './langfuse/instrumentation';
import { ensureDaemon, getDaemonSessionId, cleanupDaemon } from './langfuse/runner-daemon';
import { resolveUserId, flushTracing } from './langfuse/runner-tracing';
import { evaluateRun } from './langfuse/runner-eval';
import {
  createInitialState,
  handleMessage,
  finalizePendingTools,
  finalizeSessionSpan,
} from './langfuse/runner-message-handler';

const repoRoot = resolveRepoRoot(__dirname);
config({ path: path.join(repoRoot, '.env.langfuse') });

const { values: args } = parseArgs({
  options: {
    prompt: { type: 'string', short: 'p' },
    model: { type: 'string', short: 'm', default: 'claude-sonnet-4-6' },
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

if (!process.env.ANTHROPIC_API_KEY) {
  process.stderr.write(
    'Error: ANTHROPIC_API_KEY is required. Set it in .env.langfuse or as an env var.\n',
  );
  process.exit(1);
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

async function run(): Promise<void> {
  const daemonPort = await ensureDaemon(repoRoot);
  const daemonSessionId = await getDaemonSessionId(daemonPort);
  const maxTurns = parseInt(args['max-turns'] ?? '50', 10);

  if (daemonSessionId) {
    process.stderr.write(
      `[RUNNER] Daemon session: ${daemonSessionId} (reusing for Langfuse)\n`,
    );
  }

  process.stderr.write(`\n[RUNNER] Prompt: ${args.prompt}\n`);
  process.stderr.write(`[RUNNER] Model: ${args.model}\n`);
  process.stderr.write(`[RUNNER] Max turns: ${maxTurns}\n\n`);

  const runnerConfig = {
    prompt: args.prompt!,
    model: args.model ?? 'claude-sonnet-4-6',
    maxTurns,
    redact: args.redact ?? false,
    verbose: args.verbose ?? false,
    userId: resolveUserId(),
    startTime: Date.now(),
    initialSessionId: daemonSessionId,
  };

  const state = createInitialState(runnerConfig);

  for await (const message of query({
    prompt: runnerConfig.prompt,
    options: {
      model: runnerConfig.model,
      maxTurns: runnerConfig.maxTurns,
      cwd: repoRoot,
      permissionMode: 'bypassPermissions',
      allowDangerouslySkipPermissions: true,
      systemPrompt: METAMASK_SYSTEM_PROMPT,
      // options.env replaces process.env entirely — always spread first
      env: { ...process.env },
      ...(runnerConfig.verbose
        ? { stderr: (data: string) => process.stderr.write(data) }
        : {}),
    },
  })) {
    handleMessage(message, state, runnerConfig);
  }

  finalizePendingTools(state);
  finalizeSessionSpan(state);
  await flushTracing();

  await evaluateRun({
    prompt: runnerConfig.prompt,
    result: state.finalResult,
    conversationLog: state.conversationLog,
    turns: state.turns,
    traceId: state.traceId,
    success: state.finalResult !== undefined,
  });
}

run()
  .catch((error: Error) => {
    process.stderr.write(`[RUNNER] Fatal error: ${error.message}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    cleanupDaemon(repoRoot);
    if (otelSdk) {
      await otelSdk.shutdown();
    }
  });
