import { createAgentRunner } from '@metamask/agent-runner';
import type { AgentRunner } from '@metamask/agent-runner';
import type { EvalConfig } from '../config/schema';
import type { ScenarioFactory } from '../scenarios/types';
import type {
  BatchSummary,
  MultiBatchSummary,
  ScenarioSummary,
  TrialResult,
} from '../types';
import { generateBatchTimestamp, generateTrialId } from '../artifacts/paths';
import {
  writeBatchSummary,
  writeMultiBatchSummary,
} from '../artifacts/summary';
import { teardownTrial } from './teardown';
import { runTrial } from './trial-runner';

/**
 * Creates a sentinel runner that holds the shared OTel/Langfuse infrastructure
 * alive for the duration of a batch. Without this, each trial's runner creates
 * and destroys the NodeSDK, and the global OTel TracerProvider enters a no-op
 * state after the first shutdown — silently dropping all subsequent spans.
 *
 * The sentinel increments the ref count so per-trial shutdown() calls never
 * reach zero. Call {@link shutdownTelemetrySentinel} after all trials complete.
 */
function createTelemetrySentinel(config: EvalConfig): AgentRunner | undefined {
  if (!config.telemetry.enabled) {
    return undefined;
  }
  return createAgentRunner({
    telemetry: {
      mode: 'enabled',
      serviceName: config.telemetry.serviceName,
    },
  });
}

async function shutdownTelemetrySentinel(
  sentinel: AgentRunner | undefined,
): Promise<void> {
  if (!sentinel) {
    return;
  }
  try {
    await sentinel.flush();
    await sentinel.shutdown();
  } catch {
    /* best-effort cleanup */
  }
}

export async function runBatch(
  scenarioFactory: ScenarioFactory,
  config: EvalConfig,
): Promise<BatchSummary> {
  const sentinel = createTelemetrySentinel(config);

  try {
    const batchTimestamp = generateBatchTimestamp();
    const trials: TrialResult[] = [];

    const firstScenario = await scenarioFactory(0);
    const scenarioName = firstScenario.name;

    console.log(`\n========================================`);
    console.log(`Eval batch: ${scenarioName}`);
    console.log(`Model: ${config.model}`);
    console.log(`Trials: ${config.trials}`);
    console.log(`Timestamp: ${batchTimestamp}`);
    console.log(`========================================\n`);

    for (let i = 0; i < config.trials; i++) {
      const trialId = generateTrialId(i);
      const scenario = i === 0 ? firstScenario : await scenarioFactory(i);

      try {
        const result = await runTrial(scenario, trialId, config, batchTimestamp);
        trials.push(result);
      } catch (err) {
        console.error(`[batch] Trial ${trialId} threw unexpectedly:`, err);
        trials.push(makeFailedTrial(trialId, scenarioName, err));
      }
    }

    const summary = writeBatchSummary(
      trials,
      scenarioName,
      config.model,
      batchTimestamp,
      config.artifactsDir,
    );

    console.log(`\n========================================`);
    console.log(
      `Batch complete: ${summary.successCount}/${summary.totalTrials} passed`,
    );
    console.log(`Artifacts: ${config.artifactsDir}/${batchTimestamp}`);
    console.log(`========================================\n`);

    teardownTrial(config.extensionCwd, true);

    return summary;
  } finally {
    await shutdownTelemetrySentinel(sentinel);
  }
}

export async function runMultiBatch(
  scenarioEntries: { name: string; factory: ScenarioFactory }[],
  config: EvalConfig,
): Promise<MultiBatchSummary> {
  const sentinel = createTelemetrySentinel(config);

  try {
    const batchTimestamp = generateBatchTimestamp();
    const scenarioSummaries: ScenarioSummary[] = [];

    console.log(`\n========================================`);
    console.log(`Multi-scenario eval batch`);
    console.log(
      `Scenarios: ${scenarioEntries.map((e) => e.name).join(', ')}`,
    );
    console.log(`Model: ${config.model}`);
    console.log(`Trials per scenario: ${config.trials}`);
    console.log(`Timestamp: ${batchTimestamp}`);
    console.log(`========================================\n`);

    for (const entry of scenarioEntries) {
      const trials: TrialResult[] = [];

      console.log(`\n--- Scenario: ${entry.name} ---\n`);

      let difficulty: ScenarioSummary['difficulty'] = 'medium';

      for (let i = 0; i < config.trials; i++) {
        const trialId = generateTrialId(i);
        const scenario = await entry.factory(i);
        difficulty = scenario.difficulty;

        try {
          const result = await runTrial(
            scenario,
            trialId,
            config,
            batchTimestamp,
          );
          trials.push(result);
        } catch (err) {
          console.error(`[batch] Trial ${trialId} threw unexpectedly:`, err);
          trials.push(makeFailedTrial(trialId, scenario.name, err));
        }
      }

      const batchSummary = writeBatchSummary(
        trials,
        entry.name,
        config.model,
        batchTimestamp,
        config.artifactsDir,
      );

      scenarioSummaries.push({ ...batchSummary, difficulty });

      console.log(
        `  ${entry.name}: ${batchSummary.successCount}/${batchSummary.totalTrials} passed`,
      );

      teardownTrial(config.extensionCwd, true);
    }

    const multiBatchSummary = writeMultiBatchSummary(
      scenarioSummaries,
      config.model,
      batchTimestamp,
      config.artifactsDir,
    );

    const agg = multiBatchSummary.aggregate;
    console.log(`\n========================================`);
    console.log(`Multi-batch complete`);
    console.log(
      `Overall: ${agg.totalTrials} trials, ${(agg.overallSuccessRate * 100).toFixed(1)}% success`,
    );
    for (const [diff, rate] of Object.entries(agg.successRateByDifficulty)) {
      console.log(`  ${diff}: ${(rate * 100).toFixed(1)}%`);
    }
    console.log(`Artifacts: ${config.artifactsDir}/${batchTimestamp}`);
    console.log(`========================================\n`);

    return multiBatchSummary;
  } finally {
    await shutdownTelemetrySentinel(sentinel);
  }
}

function makeFailedTrial(
  trialId: string,
  scenario: string,
  err: unknown,
): TrialResult {
  return {
    trialId,
    scenario,
    status: 'failed_agent',
    assertion: {
      passed: false,
      expected: 'trial completion',
      actual: undefined,
      detail: `Unhandled error: ${String(err)}`,
    },
    metrics: {
      durationMs: 0,
      totalCostUsd: undefined,
      messageCount: 0,
      agentDecisionCount: 0,
      mmCommandCount: 0,
    },
    judgeScores: null,
    toolJudgeScores: null,
    agentSessionId: undefined,
    error: err instanceof Error ? err.message : String(err),
    artifactDir: '',
  };
}
