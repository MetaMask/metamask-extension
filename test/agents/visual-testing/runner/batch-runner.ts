import type { EvalConfig } from '../config/schema';
import type { Scenario } from '../scenarios/types';
import type { BatchSummary, TrialResult } from '../types';
import { generateBatchTimestamp, generateTrialId } from '../artifacts/paths';
import { writeBatchSummary } from '../artifacts/summary';
import { teardownTrial } from './teardown';
import { runTrial } from './trial-runner';

export async function runBatch(
  scenarioFactory: (trialIndex: number) => Scenario,
  config: EvalConfig,
): Promise<BatchSummary> {
  const batchTimestamp = generateBatchTimestamp();
  const trials: TrialResult[] = [];

  console.log(`\n========================================`);
  console.log(`Eval batch: ${config.scenario}`);
  console.log(`Model: ${config.model}`);
  console.log(`Trials: ${config.trials}`);
  console.log(`Timestamp: ${batchTimestamp}`);
  console.log(`========================================\n`);

  for (let i = 0; i < config.trials; i++) {
    const trialId = generateTrialId(i);
    const scenario = scenarioFactory(i);

    try {
      const result = await runTrial(scenario, trialId, config, batchTimestamp);
      trials.push(result);
    } catch (err) {
      console.error(`[batch] Trial ${trialId} threw unexpectedly:`, err);
      trials.push(makeFailedTrial(trialId, scenario.name, err));
    }
  }

  const summary = writeBatchSummary(
    trials,
    config.scenario,
    config.model,
    batchTimestamp,
    config.artifactsDir,
  );

  console.log(`\n========================================`);
  console.log(`Batch complete: ${summary.successCount}/${summary.totalTrials} passed`);
  console.log(`Artifacts: ${config.artifactsDir}/${batchTimestamp}`);
  console.log(`========================================\n`);

  teardownTrial(config.extensionCwd, true);

  return summary;
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
      detail: `Unhandled error: ${err}`,
    },
    metrics: {
      durationMs: 0,
      totalCostUsd: undefined,
      messageCount: 0,
      agentDecisionCount: 0,
      mmCommandCount: 0,
    },
    judgeScores: null,
    agentSessionId: undefined,
    error: err instanceof Error ? err.message : String(err),
    artifactDir: '',
  };
}
