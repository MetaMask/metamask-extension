#!/usr/bin/env node
/**
 * Provider-agnostic agent runner with Langfuse tracing.
 *
 * Usage:
 *   npx tsx test/e2e/playwright/llm-workflow/agent-runner.ts \
 *     --prompt "Navigate to settings and verify Ethereum Mainnet is listed"
 */
import path from 'path';
import { config } from 'dotenv';
import { parseArgs } from 'node:util';

import { resolveRepoRoot } from './resolve-repo-root';
import { otelSdk } from './langfuse/instrumentation';
import { ensureDaemon, getDaemonSessionId, cleanupDaemon } from './langfuse/runner-daemon';
import { resolveUserId, flushTracing } from './langfuse/runner-tracing';
import { evaluateRun } from './langfuse/runner-eval';
import { createClaudeAdapter, createClaudeJudge } from './langfuse/adapters/claude-adapter';
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
    'max-turns': { type: 'string', default: '50' },
    redact: { type: 'boolean', default: false },
    verbose: { type: 'boolean', short: 'v', default: false },
  },
  strict: true,
});

if (!args.prompt) {
  process.stderr.write(
    'Usage: agent-runner.ts --prompt "your task description"\n',
  );
  process.exit(1);
}

if (!process.env.ANTHROPIC_API_KEY) {
  process.stderr.write(
    'Error: ANTHROPIC_API_KEY is required. Set it in .env.langfuse or as an env var.\n',
  );
  process.exit(1);
}

const adapter = createClaudeAdapter();
const judge = createClaudeJudge('claude-sonnet-4-6');

async function run(): Promise<void> {
  const daemonPort = await ensureDaemon(repoRoot);
  const daemonSessionId = await getDaemonSessionId(daemonPort);
  const maxTurns = parseInt(args['max-turns'] ?? '50', 10);
  const model = args.model ?? 'claude-sonnet-4-6';

  if (daemonSessionId) {
    process.stderr.write(
      `[RUNNER] Daemon session: ${daemonSessionId} (reusing for Langfuse)\n`,
    );
  }

  process.stderr.write(`\n[RUNNER] Provider: ${adapter.name}\n`);
  process.stderr.write(`[RUNNER] Prompt: ${args.prompt}\n`);
  process.stderr.write(`[RUNNER] Model: ${model}\n`);
  process.stderr.write(`[RUNNER] Max turns: ${maxTurns}\n\n`);

  const runnerConfig = {
    prompt: args.prompt!,
    model,
    maxTurns,
    redact: args.redact ?? false,
    verbose: args.verbose ?? false,
    userId: resolveUserId(),
    startTime: Date.now(),
    initialSessionId: daemonSessionId,
  };

  const state = createInitialState(runnerConfig);

  try {
    for await (const message of adapter.run({
      prompt: runnerConfig.prompt,
      model: runnerConfig.model,
      maxTurns: runnerConfig.maxTurns,
      skills: ['metamask-visual-testing'],
      cwd: repoRoot,
      env: { ...process.env },
      verbose: runnerConfig.verbose,
    })) {
      handleMessage(message, state, runnerConfig);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`[RUNNER] ✗ Failed: ${msg}\n`);
    process.exitCode = 1;
  } finally {
    finalizePendingTools(state);
    finalizeSessionSpan(state);
    await flushTracing();

    await evaluateRun(
      {
        prompt: runnerConfig.prompt,
        result: state.finalResult,
        conversationLog: state.conversationLog,
        turns: state.turns,
        totalInputTokens: state.totalInputTokens,
        totalOutputTokens: state.totalOutputTokens,
        traceId: state.traceId,
        success: state.finalResult !== undefined,
      },
      judge,
    );
  }
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
