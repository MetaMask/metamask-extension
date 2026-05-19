import fs from 'node:fs';
import type {
  BatchSummary,
  JudgeScores,
  MultiBatchSummary,
  ScenarioSummary,
  ToolJudgeScores,
  TrialResult,
} from '../types';
import type { ScenarioDifficulty } from '../scenarios/types';
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
    trials,
  };

  const jsonPath = summaryJsonPath(artifactsDir, batchTimestamp);
  fs.mkdirSync(fs.realpathSync(jsonPath + '/..'), { recursive: true });
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
  for (const [diff, trials] of byDifficulty) {
    const successes = trials.filter((t) => t.status === 'success').length;
    successRateByDifficulty[diff] = trials.length > 0 ? successes / trials.length : 0;
  }

  const summary: MultiBatchSummary = {
    batchTimestamp,
    model,
    scenarios: scenarioSummaries,
    aggregate: {
      totalTrials,
      overallSuccessRate: totalTrials > 0 ? totalSuccess / totalTrials : 0,
      successRateByDifficulty,
      avgJudgeScores: computeAvgJudgeScores(allTrials),
      avgToolJudgeScores: computeAvgToolJudgeScores(allTrials),
    },
  };

  const jsonPath = summaryJsonPath(artifactsDir, batchTimestamp);
  fs.mkdirSync(fs.realpathSync(jsonPath + '/..'), { recursive: true });
  fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2));

  const mdPath = summaryMdPath(artifactsDir, batchTimestamp);
  fs.writeFileSync(mdPath, renderMultiBatchMarkdown(summary));

  return summary;
}

function renderMultiBatchMarkdown(summary: MultiBatchSummary): string {
  const lines: string[] = [
    '# Multi-Scenario Eval Summary',
    '',
    `**Batch:** ${summary.batchTimestamp}`,
    `**Model:** ${summary.model}`,
    `**Scenarios:** ${summary.scenarios.length}`,
    `**Total trials:** ${summary.aggregate.totalTrials}`,
    `**Overall success rate:** ${(summary.aggregate.overallSuccessRate * 100).toFixed(1)}%`,
    '',
    '## Results by Difficulty',
    '',
    '| Difficulty | Scenarios | Trials | Success Rate |',
    '|------------|-----------|--------|-------------|',
  ];

  const difficultyOrder: ScenarioDifficulty[] = ['easy', 'medium', 'hard'];
  for (const diff of difficultyOrder) {
    const scenarios = summary.scenarios.filter((s) => s.difficulty === diff);
    if (scenarios.length === 0) {
      continue;
    }
    const trials = scenarios.reduce((sum, s) => sum + s.totalTrials, 0);
    const rate = summary.aggregate.successRateByDifficulty[diff] ?? 0;
    lines.push(
      `| ${diff} | ${scenarios.length} | ${trials} | ${(rate * 100).toFixed(1)}% |`,
    );
  }

  lines.push('', '## Per-Scenario Results', '');
  lines.push(
    '| Scenario | Difficulty | Trials | Success Rate | Avg Duration | Avg Cost |',
    '|----------|------------|--------|-------------|-------------|----------|',
  );

  for (const s of summary.scenarios) {
    const cost =
      s.avgCostUsd !== undefined ? `$${s.avgCostUsd.toFixed(4)}` : 'N/A';
    lines.push(
      `| ${s.scenario} | ${s.difficulty} | ${s.totalTrials} | ${(s.successRate * 100).toFixed(1)}% | ${(s.avgDurationMs / 1000).toFixed(1)}s | ${cost} |`,
    );
  }

  if (summary.aggregate.avgJudgeScores) {
    lines.push('', '## Aggregate Judge Scores', '');
    lines.push('| Dimension | Score |', '|-----------|-------|');
    const scores = summary.aggregate.avgJudgeScores;
    if (scores.efficiency !== undefined) {
      lines.push(`| Efficiency | ${scores.efficiency.toFixed(2)} |`);
    }
    if (scores.toolUsage !== undefined) {
      lines.push(`| Tool Usage | ${scores.toolUsage.toFixed(2)} |`);
    }
    if (scores.recovery !== undefined) {
      lines.push(`| Recovery | ${scores.recovery.toFixed(2)} |`);
    }
    if (scores.strategy !== undefined) {
      lines.push(`| Strategy | ${scores.strategy.toFixed(2)} |`);
    }
  }

  if (summary.aggregate.avgToolJudgeScores) {
    lines.push('', '## Aggregate Tool Judge Scores', '');
    lines.push('| Dimension | Score |', '|-----------|-------|');
    const toolScores = summary.aggregate.avgToolJudgeScores;
    if (toolScores.outputAccuracy !== undefined) {
      lines.push(
        `| Output Accuracy | ${toolScores.outputAccuracy.toFixed(2)} |`,
      );
    }
    if (toolScores.outputClarity !== undefined) {
      lines.push(
        `| Output Clarity | ${toolScores.outputClarity.toFixed(2)} |`,
      );
    }
    if (toolScores.interactionReliability !== undefined) {
      lines.push(
        `| Interaction Reliability | ${toolScores.interactionReliability.toFixed(2)} |`,
      );
    }
    if (toolScores.errorQuality !== undefined) {
      lines.push(
        `| Error Quality | ${toolScores.errorQuality.toFixed(2)} |`,
      );
    }
  }

  lines.push('');
  return lines.join('\n');
}

function renderMarkdown(summary: BatchSummary): string {
  const lines: string[] = [
    `# Eval Summary: ${summary.scenario}`,
    '',
    `**Batch:** ${summary.batchTimestamp}`,
    `**Model:** ${summary.model}`,
    `**Trials:** ${summary.totalTrials}`,
    `**Success rate:** ${(summary.successRate * 100).toFixed(1)}% (${summary.successCount}/${summary.totalTrials})`,
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
      '| Dimension | Score |',
      '|-----------|-------|',
    );
    const scores = summary.avgJudgeScores;
    if (scores.efficiency !== undefined) {
      lines.push(`| Efficiency | ${scores.efficiency.toFixed(2)} |`);
    }
    if (scores.toolUsage !== undefined) {
      lines.push(`| Tool Usage | ${scores.toolUsage.toFixed(2)} |`);
    }
    if (scores.recovery !== undefined) {
      lines.push(`| Recovery | ${scores.recovery.toFixed(2)} |`);
    }
    if (scores.strategy !== undefined) {
      lines.push(`| Strategy | ${scores.strategy.toFixed(2)} |`);
    }
  }

  if (summary.avgToolJudgeScores) {
    lines.push(
      '',
      '## Tool Judge Scores (avg)',
      '',
      '| Dimension | Score |',
      '|-----------|-------|',
    );
    const toolScores = summary.avgToolJudgeScores;
    if (toolScores.outputAccuracy !== undefined) {
      lines.push(`| Output Accuracy | ${toolScores.outputAccuracy.toFixed(2)} |`);
    }
    if (toolScores.outputClarity !== undefined) {
      lines.push(`| Output Clarity | ${toolScores.outputClarity.toFixed(2)} |`);
    }
    if (toolScores.interactionReliability !== undefined) {
      lines.push(`| Interaction Reliability | ${toolScores.interactionReliability.toFixed(2)} |`);
    }
    if (toolScores.errorQuality !== undefined) {
      lines.push(`| Error Quality | ${toolScores.errorQuality.toFixed(2)} |`);
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
