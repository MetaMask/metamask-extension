import type { AgentRunResult } from '@metamask/agent-runner';

/**
 * Terminal status of a single trial run.
 */
export type TerminalStatus =
  | 'success'
  | 'failed_assertion'
  | 'failed_guardrail'
  | 'failed_tool'
  | 'failed_agent';

/**
 * Result of an assertion check against the post-agent screen state.
 */
export type AssertionResult = {
  passed: boolean;
  expected: string;
  actual: string | undefined;
  detail: string;
};

/**
 * Qualitative scores from the LLM-as-judge evaluation.
 * Each dimension is scored 1–5.
 */
export type JudgeScores = {
  efficiency: number;
  toolUsage: number;
  recovery: number;
  strategy: number;
  reasoning: string;
};

/**
 * Metrics collected during a single trial.
 */
export type TrialMetrics = {
  durationMs: number;
  totalCostUsd: number | undefined;
  messageCount: number;
  agentDecisionCount: number;
  mmCommandCount: number;
};

/**
 * Full result of a single trial run.
 */
export type TrialResult = {
  trialId: string;
  scenario: string;
  status: TerminalStatus;
  assertion: AssertionResult;
  metrics: TrialMetrics;
  judgeScores: JudgeScores | null;
  agentSessionId: string | undefined;
  error: string | undefined;
  artifactDir: string;
};

/**
 * Aggregated summary of a batch of trials.
 */
export type BatchSummary = {
  batchTimestamp: string;
  scenario: string;
  model: string;
  totalTrials: number;
  successCount: number;
  successRate: number;
  avgDurationMs: number;
  avgCostUsd: number | undefined;
  avgAgentDecisions: number;
  avgMmCommands: number;
  avgJudgeScores: Partial<Omit<JudgeScores, 'reasoning'>> | null;
  trials: TrialResult[];
};

/**
 * Lightweight counters accumulated via onMessage callback.
 */
export type MessageCounts = {
  agentDecisionCount: number;
  mmCommandCount: number;
};

/**
 * Result from the agent runner, re-exported for convenience.
 */
export type { AgentRunResult };
