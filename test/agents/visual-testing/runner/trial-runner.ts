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
  SKILL_MD_PATH,
} from '../constants';
import { composeTaskPrompt, loadSystemPrompt } from '../prompts/load-prompt';
import type { Scenario } from '../scenarios/types';
import type { JudgeScores, ToolJudgeScores, TrialResult } from '../types';
import { screenshotsDir, trialDir } from '../artifacts/paths';
import { writeTrialArtifact } from '../artifacts/writer';
import { extractHarnessMetrics } from '../scoring/harness-metrics';
import { createMessageCounter } from '../scoring/message-counter';
import { determineStatus } from '../scoring/status';
import { checkAssertion } from './assertions';
import { setupTrial, takeScreenshot } from './setup';
import { teardownTrial } from './teardown';

const JUDGE_PROMPT_PATH = path.join(__dirname, '..', 'scoring', 'judge-prompt.md');
const TOOL_JUDGE_PROMPT_PATH = path.join(__dirname, '..', 'scoring', 'tool-judge-prompt.md');

/**
 * A JudgeScoreField whose `name` must be a numeric key of the target
 * score type. Catches field-name drift at compile time.
 */
type TypedScoreField<T> = JudgeScoreField & {
  name: keyof Omit<T, 'reasoning'>;
};

const JUDGE_SCORE_FIELDS: TypedScoreField<JudgeScores>[] = [
  { name: 'efficiency', min: 1, max: 5 },
  { name: 'toolUsage', min: 1, max: 5 },
  { name: 'recovery', min: 1, max: 5 },
  { name: 'strategy', min: 1, max: 5 },
];

const TOOL_JUDGE_SCORE_FIELDS: TypedScoreField<ToolJudgeScores>[] = [
  { name: 'outputAccuracy', min: 1, max: 5 },
  { name: 'outputClarity', min: 1, max: 5 },
  { name: 'interactionReliability', min: 1, max: 5 },
  { name: 'errorQuality', min: 1, max: 5 },
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

    let activeTaskPrompt = scenario.taskPrompt;
    let activeAssertion = scenario.assertion;

    if (scenario.beforeAgent) {
      const setupResult = await scenario.beforeAgent(config.extensionCwd);
      if (setupResult) {
        if (setupResult.taskPromptOverride) {
          activeTaskPrompt = setupResult.taskPromptOverride;
        }
        if (setupResult.assertionOverride) {
          activeAssertion = setupResult.assertionOverride;
        }
      }
    }

    const activeScenario = {
      ...scenario,
      taskPrompt: activeTaskPrompt,
      assertion: activeAssertion,
    };

    takeScreenshot(config.extensionCwd, 'start', ssDir);

    const runResult = await executeAgent(activeScenario, config, batchTimestamp, trialId);

    takeScreenshot(config.extensionCwd, 'end', ssDir);

    const assertion = checkAssertion(activeScenario.assertion, config.extensionCwd);
    const status = determineStatus(runResult.result, assertion);

    let judgeScores: JudgeScores | null = null;
    if (config.judge.enabled) {
      judgeScores = await runJudge(runResult.result, scenario, status, config);
    }

    let toolJudgeScores: ToolJudgeScores | null = null;
    if (config.toolJudge.enabled) {
      toolJudgeScores = await runToolJudge(runResult.result, scenario, status, config);
    }

    const metrics = extractHarnessMetrics(runResult.result, runResult.counts);

    const result: TrialResult = {
      trialId,
      scenario: scenario.name,
      status,
      assertion,
      metrics,
      judgeScores,
      toolJudgeScores,
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
        process.stdout.write(`${line  }\n`);
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

type JudgeEvalParams<T> = {
  label: string;
  rubric: string;
  scoreFields: JudgeScoreField[];
  model: string;
  convertScores: (result: JudgeResult) => T | null;
};

async function runJudgeEval<T>(
  params: JudgeEvalParams<T>,
  runResult: AgentRunResult,
  scenario: Scenario,
  status: string,
  config: EvalConfig,
): Promise<T | null> {
  let runner: ReturnType<typeof createAgentRunner> | null = null;

  try {
    const judgeConfig: JudgeConfig = {
      rubric: params.rubric,
      scoreFields: params.scoreFields,
      queryOptions: {
        model: params.model,
        maxTurns: 50,
      },
    };

    runner = createAgentRunner({
      telemetry: config.telemetry.enabled
        ? {
            mode: 'enabled',
            serviceName: config.telemetry.serviceName,
          }
        : undefined,
    });

    console.log(`#### STARTING ${params.label.toUpperCase()} ####`);
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
            process.stdout.write(`${line  }\n`);
          }
        },
      },
    );

    return params.convertScores(result);
  } catch (error) {
    console.warn(`[${params.label}] LLM ${params.label} evaluation failed:`, error);
    return null;
  } finally {
    if (runner) {
      try {
        await runner.flush();
        await runner.shutdown();
      } catch {
        /* best-effort */
      }
    }
  }
}

async function runJudge(
  runResult: AgentRunResult,
  scenario: Scenario,
  status: string,
  config: EvalConfig,
): Promise<JudgeScores | null> {
  const rubric = fs.readFileSync(JUDGE_PROMPT_PATH, 'utf-8');
  return runJudgeEval(
    {
      label: 'judge',
      rubric,
      scoreFields: JUDGE_SCORE_FIELDS,
      model: config.judge.model,
      convertScores: toJudgeScores,
    },
    runResult,
    scenario,
    status,
    config,
  );
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

async function runToolJudge(
  runResult: AgentRunResult,
  scenario: Scenario,
  status: string,
  config: EvalConfig,
): Promise<ToolJudgeScores | null> {
  try {
    const baseRubric = fs.readFileSync(TOOL_JUDGE_PROMPT_PATH, 'utf-8');
    const skillPath = path.join(config.extensionCwd, SKILL_MD_PATH);
    const skillContent = fs.existsSync(skillPath)
      ? fs.readFileSync(skillPath, 'utf-8')
      : '';
    const rubric = skillContent
      ? `${baseRubric}\n\n## mm CLI Specification\n\n${skillContent}`
      : baseRubric;

    return await runJudgeEval(
      {
        label: 'tool-judge',
        rubric,
        scoreFields: TOOL_JUDGE_SCORE_FIELDS,
        model: config.toolJudge.model,
        convertScores: toToolJudgeScores,
      },
      runResult,
      scenario,
      status,
      config,
    );
  } catch (error) {
    console.warn('[tool-judge] LLM tool judge evaluation failed:', error);
    return null;
  }
}

function isValidScore(value: unknown): value is number {
  return typeof value === 'number' && value >= 1 && value <= 5;
}

function toToolJudgeScores(result: JudgeResult): ToolJudgeScores | null {
  const {
    outputAccuracy,
    outputClarity,
    interactionReliability,
    errorQuality,
  } = result.scores;

  if (
    !isValidScore(outputAccuracy) ||
    !isValidScore(outputClarity) ||
    !isValidScore(interactionReliability) ||
    !isValidScore(errorQuality)
  ) {
    console.warn(
      '[tool-judge] Invalid or missing score fields, discarding result:',
      result.scores,
    );
    return null;
  }

  return {
    outputAccuracy,
    outputClarity,
    interactionReliability,
    errorQuality,
    reasoning: result.reasoning,
  };
}
