import fs from 'node:fs';
import type { BatchSummary, JudgeScores, TrialResult } from '../types';
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
