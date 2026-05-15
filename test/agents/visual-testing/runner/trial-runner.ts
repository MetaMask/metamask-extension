import fs from 'node:fs';
import path from 'node:path';
import { createAgentRunner, formatMessage } from '@metamask/agent-runner';
import type {
  AgentMessage,
  AgentRunResult,
  JudgeConfig,
  JudgeResult,
  JudgeScoreField,
  ScoreEntry,
} from '@metamask/agent-runner';
import type { EvalConfig } from '../config/schema';
import {
  DEFAULT_ALLOWED_TOOLS,
  DISALLOWED_KNOWLEDGE_PATTERNS,
  DISALLOWED_LIFECYCLE_PATTERNS,
} from '../constants';
import { composeTaskPrompt, loadSystemPrompt } from '../prompts/load-prompt';
import type { Scenario } from '../scenarios/types';
import type { JudgeScores, TrialResult } from '../types';
import { screenshotsDir, trialDir } from '../artifacts/paths';
import { writeTrialArtifact } from '../artifacts/writer';
import { extractHarnessMetrics } from '../scoring/harness-metrics';
import { createMessageCounter } from '../scoring/message-counter';
import { determineStatus } from '../scoring/status';
import { checkAssertion } from './assertions';
import { setupTrial, takeScreenshot } from './setup';
import { teardownTrial } from './teardown';

const JUDGE_PROMPT_PATH = path.join(__dirname, '..', 'scoring', 'judge-prompt.md');

const JUDGE_SCORE_FIELDS: JudgeScoreField[] = [
  { name: 'efficiency', min: 1, max: 5 },
  { name: 'toolUsage', min: 1, max: 5 },
  { name: 'recovery', min: 1, max: 5 },
  { name: 'strategy', min: 1, max: 5 },
];

export async function runTrial(
  scenario: Scenario,
  trialId: string,
  config: EvalConfig,
  batchTimestamp: string,
): Promise<TrialResult> {
  const artifactDir = trialDir(
    config.artifactsDir,
    batchTimestamp,
    scenario.name,
    trialId,
  );
  const ssDir = screenshotsDir(
    config.artifactsDir,
    batchTimestamp,
    scenario.name,
    trialId,
  );

  console.log(`\n[trial] ${trialId} — starting: ${scenario.name}`);

  try {
    setupTrial(
      config.extensionCwd,
      scenario.stateMode,
      scenario.statePreset,
      config.coldStart,
    );

    takeScreenshot(config.extensionCwd, 'start', ssDir);

    const runResult = await executeAgent(scenario, config, batchTimestamp, trialId);

    takeScreenshot(config.extensionCwd, 'end', ssDir);

    const assertion = checkAssertion(scenario.assertion, config.extensionCwd);
    const status = determineStatus(runResult.result, assertion);

    let judgeScores: JudgeScores | null = null;
    if (config.judge.enabled) {
      judgeScores = await runJudge(runResult.result, scenario, status, config);
    }

    const metrics = extractHarnessMetrics(runResult.result, runResult.counts);

    const result: TrialResult = {
      trialId,
      scenario: scenario.name,
      status,
      assertion,
      metrics,
      judgeScores,
      agentSessionId: runResult.result.sessionId,
      error: runResult.result.error?.message,
      artifactDir,
    };

    writeTrialArtifact(result, config, batchTimestamp);
    console.log(`[trial] ${trialId} — ${status}`);

    return result;
  } finally {
    teardownTrial(config.extensionCwd);
  }
}

async function executeAgent(
  scenario: Scenario,
  config: EvalConfig,
  batchTimestamp: string,
  trialId: string,
) {
  const runner = createAgentRunner({
    telemetry: {
      mode: config.telemetry.enabled ? 'enabled' : 'disabled',
      serviceName: config.telemetry.serviceName,
    },
  });

  const counter = createMessageCounter();
  const systemPrompt = loadSystemPrompt(config.extensionCwd);
  const taskPrompt = composeTaskPrompt(scenario.taskPrompt);

  const disallowedTools = [
    ...DISALLOWED_LIFECYCLE_PATTERNS,
    ...scenario.disallowedBashPatterns,
    ...(config.coldStart ? DISALLOWED_KNOWLEDGE_PATTERNS : []),
  ];

  const wallclockTimeout = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`wallclock timeout after ${config.guardrails.maxWallclockMs}ms`));
    }, config.guardrails.maxWallclockMs);
  });

  const agentRun = runner.runAgent({
    prompt: taskPrompt,
    options: {
      cwd: config.extensionCwd,
      maxTurns: config.guardrails.maxTurns,
      model: config.model,
      systemPrompt: { type: "preset", preset: "claude_code", append: systemPrompt },
      allowedTools: DEFAULT_ALLOWED_TOOLS,
      settingSources:['user', 'project'],
      disallowedTools,
      skills: ["metamask-visual-testing"]
    },
    onMessage: (message) => {
      counter.process(message)
      const line = formatMessage(message);
      if (line !== null) {
        process.stdout.write(line + '\n');
      }
    },
    telemetry: {
      traceName: `eval-${scenario.name}`,
      sessionId: `eval-batch-${batchTimestamp}`,
      tags: ['eval', scenario.name],
      metadata: { model: config.model, trialId },
    },
  });

  const result = await Promise.race([agentRun, wallclockTimeout]);

  try {
    await runner.flush();
    await runner.shutdown();
  } catch {
    /* flush is best-effort */
  }

  return { result, counts: counter.counts };
}

async function runJudge(
  runResult: AgentRunResult,
  scenario: Scenario,
  status: string,
  config: EvalConfig,
): Promise<JudgeScores | null> {
  const rubric = fs.readFileSync(JUDGE_PROMPT_PATH, 'utf-8');
  const judgeConfig: JudgeConfig = {
    rubric,
    scoreFields: JUDGE_SCORE_FIELDS,
    queryOptions: {
      model: config.judge.model,
      maxTurns: 50
    },
  };

  const runner = createAgentRunner({
    telemetry: config.telemetry.enabled
      ? {
          mode: 'enabled',
          serviceName: config.telemetry.serviceName,
        }
      : undefined,
  });

  try {
    console.log('#### STARTING JUDGE ####');

    console.log('result.traceId', runResult.traceId);
    const result = await runner.judge(
      runResult,
      judgeConfig,
      {
        taskPrompt: scenario.taskPrompt,
        status,
      },
      {
        postScores: true,
        onMessage: (message: AgentMessage) => {
          const line = formatMessage(message);
          if (line !== null) {
            process.stdout.write(line + '\n');
          }
        },
      }
    );

    return toJudgeScores(result);
  } catch (error) {
    console.warn('[judge] LLM judge evaluation failed:', error);
    return null;
  } finally {
    try {
      await runner.flush();
      await runner.shutdown();
    } catch {
      /* best-effort */
    }
  }
}

function toJudgeScores(result: JudgeResult): JudgeScores {
  return {
    efficiency: result.scores.efficiency ?? 0,
    toolUsage: result.scores.toolUsage ?? 0,
    recovery: result.scores.recovery ?? 0,
    strategy: result.scores.strategy ?? 0,
    reasoning: result.reasoning,
  };
}
