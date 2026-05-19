import fs from 'node:fs';
import type {
  BatchSummary,
  JudgeScores,
  MultiBatchSummary,
  ScenarioSummary,
  ToolJudgeScores,
  TrialResult,
} from '../types';
import type { ConfidenceInterval } from '../scoring/statistics';
import type { ScenarioDifficulty } from '../scenarios/types';
import { wilsonCI, sem } from '../scoring/statistics';
import { passAtK } from '../scoring/pass-at-k';
import { summaryJsonPath, summaryMdPath } from './paths';

export function writeBatchSummary(
  trials: TrialResult[],
  scenario: string,
  model: string,
  batchTimestamp: string,
  artifactsDir: string,
): BatchSummary {
  const successCount = trials.filter((t) => t.status === 'success').length;
  const durations = trials.map((t) => t.metrics.durationMs);
  const costs = trials
    .map((t) => t.metrics.totalCostUsd)
    .filter((c): c is number => c !== undefined);
  const decisions = trials.map((t) => t.metrics.agentDecisionCount);
  const mmCmds = trials.map((t) => t.metrics.mmCommandCount);

  const summary: BatchSummary = {
    batchTimestamp,
    scenario,
    model,
    totalTrials: trials.length,
    successCount,
    successRate: trials.length > 0 ? successCount / trials.length : 0,
    avgDurationMs: avg(durations),
    avgCostUsd: costs.length > 0 ? avg(costs) : undefined,
    avgAgentDecisions: avg(decisions),
    avgMmCommands: avg(mmCmds),
    avgJudgeScores: computeAvgJudgeScores(trials),
    avgToolJudgeScores: computeAvgToolJudgeScores(trials),
    successRateCI: wilsonCI(successCount, trials.length),
    judgeScoreSEM: computeJudgeScoreSEM(trials),
    toolJudgeScoreSEM: computeToolJudgeScoreSEM(trials),
    passAt1: passAtK(trials.length, successCount, 1),
    passAt3: passAtK(trials.length, successCount, 3),
    trials,
  };

  const jsonPath = summaryJsonPath(artifactsDir, batchTimestamp);
  fs.mkdirSync(fs.realpathSync(`${jsonPath  }/..`), { recursive: true });
  fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2));

  const mdPath = summaryMdPath(artifactsDir, batchTimestamp);
  fs.writeFileSync(mdPath, renderMarkdown(summary));

  return summary;
}

function avg(nums: number[]): number {
  if (nums.length === 0) {
    return 0;
  }
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function computeAvgJudgeScores(
  trials: TrialResult[],
): Partial<Omit<JudgeScores, 'reasoning'>> | null {
  const scored = trials
    .map((t) => t.judgeScores)
    .filter((s): s is JudgeScores => s !== null);

  if (scored.length === 0) {
    return null;
  }

  return {
    efficiency: avg(scored.map((s) => s.efficiency)),
    toolUsage: avg(scored.map((s) => s.toolUsage)),
    recovery: avg(scored.map((s) => s.recovery)),
    strategy: avg(scored.map((s) => s.strategy)),
  };
}

function computeAvgToolJudgeScores(
  trials: TrialResult[],
): Partial<Omit<ToolJudgeScores, 'reasoning'>> | null {
  const scored = trials
    .map((t) => t.toolJudgeScores)
    .filter((s): s is ToolJudgeScores => s !== null);

  if (scored.length === 0) {
    return null;
  }

  return {
    outputAccuracy: avg(scored.map((s) => s.outputAccuracy)),
    outputClarity: avg(scored.map((s) => s.outputClarity)),
    interactionReliability: avg(scored.map((s) => s.interactionReliability)),
    errorQuality: avg(scored.map((s) => s.errorQuality)),
  };
}

function computeJudgeScoreSEM(
  trials: TrialResult[],
): Partial<Omit<JudgeScores, 'reasoning'>> | null {
  const scored = trials
    .map((t) => t.judgeScores)
    .filter((s): s is JudgeScores => s !== null);

  if (scored.length < 2) {
    return null;
  }

  return {
    efficiency: sem(scored.map((s) => s.efficiency)),
    toolUsage: sem(scored.map((s) => s.toolUsage)),
    recovery: sem(scored.map((s) => s.recovery)),
    strategy: sem(scored.map((s) => s.strategy)),
  };
}

function computeToolJudgeScoreSEM(
  trials: TrialResult[],
): Partial<Omit<ToolJudgeScores, 'reasoning'>> | null {
  const scored = trials
    .map((t) => t.toolJudgeScores)
    .filter((s): s is ToolJudgeScores => s !== null);

  if (scored.length < 2) {
    return null;
  }

  return {
    outputAccuracy: sem(scored.map((s) => s.outputAccuracy)),
    outputClarity: sem(scored.map((s) => s.outputClarity)),
    interactionReliability: sem(scored.map((s) => s.interactionReliability)),
    errorQuality: sem(scored.map((s) => s.errorQuality)),
  };
}

export function writeMultiBatchSummary(
  scenarioSummaries: ScenarioSummary[],
  model: string,
  batchTimestamp: string,
  artifactsDir: string,
): MultiBatchSummary {
  const allTrials = scenarioSummaries.flatMap((s) => s.trials);
  const totalTrials = allTrials.length;
  const totalSuccess = allTrials.filter((t) => t.status === 'success').length;

  const byDifficulty = new Map<ScenarioDifficulty, TrialResult[]>();
  for (const scenario of scenarioSummaries) {
    const existing = byDifficulty.get(scenario.difficulty) ?? [];
    existing.push(...scenario.trials);
    byDifficulty.set(scenario.difficulty, existing);
  }

  const successRateByDifficulty: Record<string, number> = {};
  const successRateCIByDifficulty: Record<string, ConfidenceInterval> = {};
  for (const [diff, trials] of byDifficulty) {
    const successes = trials.filter((t) => t.status === 'success').length;
    successRateByDifficulty[diff] = trials.length > 0 ? successes / trials.length : 0;
    successRateCIByDifficulty[diff] = wilsonCI(successes, trials.length);
  }

  const summary: MultiBatchSummary = {
    batchTimestamp,
    model,
    scenarios: scenarioSummaries,
    aggregate: {
      totalTrials,
      overallSuccessRate: totalTrials > 0 ? totalSuccess / totalTrials : 0,
      overallSuccessRateCI: wilsonCI(totalSuccess, totalTrials),
      successRateByDifficulty,
      successRateCIByDifficulty,
      avgJudgeScores: computeAvgJudgeScores(allTrials),
      avgToolJudgeScores: computeAvgToolJudgeScores(allTrials),
      judgeScoreSEM: computeJudgeScoreSEM(allTrials),
      toolJudgeScoreSEM: computeToolJudgeScoreSEM(allTrials),
      passAt1: passAtK(totalTrials, totalSuccess, 1),
      passAt3: passAtK(totalTrials, totalSuccess, 3),
    },
  };

  const jsonPath = summaryJsonPath(artifactsDir, batchTimestamp);
  fs.mkdirSync(fs.realpathSync(`${jsonPath  }/..`), { recursive: true });
  fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2));

  const mdPath = summaryMdPath(artifactsDir, batchTimestamp);
  fs.writeFileSync(mdPath, renderMultiBatchMarkdown(summary));

  return summary;
}

function renderMultiBatchMarkdown(summary: MultiBatchSummary): string {
  const agg = summary.aggregate;
  const overallCI = agg.overallSuccessRateCI;

  const lines: string[] = [
    '# Multi-Scenario Eval Summary',
    '',
    `**Batch:** ${summary.batchTimestamp}`,
    `**Model:** ${summary.model}`,
    `**Scenarios:** ${summary.scenarios.length}`,
    `**Total trials:** ${agg.totalTrials}`,
    `**Overall success rate:** ${(agg.overallSuccessRate * 100).toFixed(1)}% [${(overallCI.lower * 100).toFixed(1)}%, ${(overallCI.upper * 100).toFixed(1)}%]`,
    `**pass@1:** ${(agg.passAt1 * 100).toFixed(1)}%  **pass@3:** ${(agg.passAt3 * 100).toFixed(1)}%`,
    '',
    '## Results by Difficulty',
    '',
    '| Difficulty | Scenarios | Trials | Success Rate | CI (95%) | pass@1 | pass@3 |',
    '|------------|-----------|--------|-------------|----------|--------|--------|',
  ];

  const difficultyOrder: ScenarioDifficulty[] = ['easy', 'medium', 'hard'];
  for (const diff of difficultyOrder) {
    const scenarios = summary.scenarios.filter((s) => s.difficulty === diff);
    if (scenarios.length === 0) {
      continue;
    }
    const trialCount = scenarios.reduce((sum, s) => sum + s.totalTrials, 0);
    const rate = agg.successRateByDifficulty[diff] ?? 0;
    const ci = agg.successRateCIByDifficulty[diff] ?? { lower: 0, upper: 0 };
    const diffTrials = scenarios.flatMap((s) => s.trials);
    const diffSuccesses = diffTrials.filter((t) => t.status === 'success').length;
    const p1 = passAtK(diffTrials.length, diffSuccesses, 1);
    const p3 = passAtK(diffTrials.length, diffSuccesses, 3);
    lines.push(
      `| ${diff} | ${scenarios.length} | ${trialCount} | ${(rate * 100).toFixed(1)}% | [${(ci.lower * 100).toFixed(1)}%, ${(ci.upper * 100).toFixed(1)}%] | ${(p1 * 100).toFixed(1)}% | ${(p3 * 100).toFixed(1)}% |`,
    );
  }

  lines.push('', '## Per-Scenario Results', '');
  lines.push(
    '| Scenario | Difficulty | Trials | Success Rate | CI (95%) | pass@1 | pass@3 | Avg Duration | Avg Cost |',
    '|----------|------------|--------|-------------|----------|--------|--------|-------------|----------|',
  );

  for (const s of summary.scenarios) {
    const cost =
      s.avgCostUsd !== undefined ? `$${s.avgCostUsd.toFixed(4)}` : 'N/A';
    const ci = s.successRateCI;
    lines.push(
      `| ${s.scenario} | ${s.difficulty} | ${s.totalTrials} | ${(s.successRate * 100).toFixed(1)}% | [${(ci.lower * 100).toFixed(1)}%, ${(ci.upper * 100).toFixed(1)}%] | ${(s.passAt1 * 100).toFixed(1)}% | ${(s.passAt3 * 100).toFixed(1)}% | ${(s.avgDurationMs / 1000).toFixed(1)}s | ${cost} |`,
    );
  }

  if (agg.avgJudgeScores) {
    lines.push('', '## Aggregate Judge Scores', '');
    lines.push('| Dimension | Score | SEM |', '|-----------|-------|-----|');
    const scores = agg.avgJudgeScores;
    const scoreSEM = agg.judgeScoreSEM;
    for (const [key, label] of [
      ['efficiency', 'Efficiency'],
      ['toolUsage', 'Tool Usage'],
      ['recovery', 'Recovery'],
      ['strategy', 'Strategy'],
    ] as const) {
      const val = scores[key];
      if (val !== undefined) {
        const semVal = scoreSEM?.[key];
        lines.push(
          `| ${label} | ${val.toFixed(2)} | ${semVal !== undefined ? `±${semVal.toFixed(2)}` : '—'} |`,
        );
      }
    }
  }

  if (agg.avgToolJudgeScores) {
    lines.push('', '## Aggregate Tool Judge Scores', '');
    lines.push('| Dimension | Score | SEM |', '|-----------|-------|-----|');
    const toolScores = agg.avgToolJudgeScores;
    const toolSEM = agg.toolJudgeScoreSEM;
    for (const [key, label] of [
      ['outputAccuracy', 'Output Accuracy'],
      ['outputClarity', 'Output Clarity'],
      ['interactionReliability', 'Interaction Reliability'],
      ['errorQuality', 'Error Quality'],
    ] as const) {
      const val = toolScores[key];
      if (val !== undefined) {
        const semVal = toolSEM?.[key];
        lines.push(
          `| ${label} | ${val.toFixed(2)} | ${semVal !== undefined ? `±${semVal.toFixed(2)}` : '—'} |`,
        );
      }
    }
  }

  lines.push('');
  return lines.join('\n');
}

function renderMarkdown(summary: BatchSummary): string {
  const ci = summary.successRateCI;
  const lines: string[] = [
    `# Eval Summary: ${summary.scenario}`,
    '',
    `**Batch:** ${summary.batchTimestamp}`,
    `**Model:** ${summary.model}`,
    `**Trials:** ${summary.totalTrials}`,
    `**Success rate:** ${(summary.successRate * 100).toFixed(1)}% (${summary.successCount}/${summary.totalTrials}) [${(ci.lower * 100).toFixed(1)}%, ${(ci.upper * 100).toFixed(1)}%]`,
    `**pass@1:** ${(summary.passAt1 * 100).toFixed(1)}%  **pass@3:** ${(summary.passAt3 * 100).toFixed(1)}%`,
    '',
    '## Metrics',
    '',
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Avg duration | ${(summary.avgDurationMs / 1000).toFixed(1)}s |`,
    `| Avg cost | ${summary.avgCostUsd !== undefined ? `$${summary.avgCostUsd.toFixed(4)}` : 'N/A'} |`,
    `| Avg agent decisions | ${summary.avgAgentDecisions.toFixed(1)} |`,
    `| Avg mm commands | ${summary.avgMmCommands.toFixed(1)} |`,
  ];

  if (summary.avgJudgeScores) {
    lines.push(
      '',
      '## Judge Scores (avg)',
      '',
      '| Dimension | Score | SEM |',
      '|-----------|-------|-----|',
    );
    const scores = summary.avgJudgeScores;
    const scoreSEM = summary.judgeScoreSEM;
    for (const [key, label] of [
      ['efficiency', 'Efficiency'],
      ['toolUsage', 'Tool Usage'],
      ['recovery', 'Recovery'],
      ['strategy', 'Strategy'],
    ] as const) {
      const val = scores[key];
      if (val !== undefined) {
        const semVal = scoreSEM?.[key];
        lines.push(
          `| ${label} | ${val.toFixed(2)} | ${semVal !== undefined ? `±${semVal.toFixed(2)}` : '—'} |`,
        );
      }
    }
  }

  if (summary.avgToolJudgeScores) {
    lines.push(
      '',
      '## Tool Judge Scores (avg)',
      '',
      '| Dimension | Score | SEM |',
      '|-----------|-------|-----|',
    );
    const toolScores = summary.avgToolJudgeScores;
    const toolSEM = summary.toolJudgeScoreSEM;
    for (const [key, label] of [
      ['outputAccuracy', 'Output Accuracy'],
      ['outputClarity', 'Output Clarity'],
      ['interactionReliability', 'Interaction Reliability'],
      ['errorQuality', 'Error Quality'],
    ] as const) {
      const val = toolScores[key];
      if (val !== undefined) {
        const semVal = toolSEM?.[key];
        lines.push(
          `| ${label} | ${val.toFixed(2)} | ${semVal !== undefined ? `±${semVal.toFixed(2)}` : '—'} |`,
        );
      }
    }
  }

  lines.push('', '## Trial Results', '', '| Trial | Status | Duration | Cost | Decisions |', '|-------|--------|----------|------|-----------|');

  for (const trial of summary.trials) {
    const cost = trial.metrics.totalCostUsd !== undefined
      ? `$${trial.metrics.totalCostUsd.toFixed(4)}`
      : 'N/A';
    lines.push(
      `| ${trial.trialId} | ${trial.status} | ${(trial.metrics.durationMs / 1000).toFixed(1)}s | ${cost} | ${trial.metrics.agentDecisionCount} |`,
    );
  }

  lines.push('');
  return lines.join('\n');
}
