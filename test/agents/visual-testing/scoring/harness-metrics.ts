import type { AgentRunResult, MessageCounts, TrialMetrics } from '../types';

export function extractHarnessMetrics(
  runResult: AgentRunResult,
  counts: MessageCounts,
): TrialMetrics {
  return {
    durationMs: runResult.durationMs,
    totalCostUsd: runResult.totalCostUsd,
    messageCount: runResult.metadata.messageCount,
    agentDecisionCount: counts.agentDecisionCount,
    mmCommandCount: counts.mmCommandCount,
  };
}
