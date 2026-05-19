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
 * Qualitative scores from the LLM-as-judge evaluation of agent performance.
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
 * Qualitative scores from the LLM-as-judge evaluation of mm CLI tool effectiveness.
 * Evaluated by a separate, specialized judge to avoid score contamination
 * with agent performance dimensions.
 * Each dimension is scored 1–5.
 */
export type ToolJudgeScores = {
  outputAccuracy: number;
  outputClarity: number;
  interactionReliability: number;
  errorQuality: number;
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
  toolJudgeScores: ToolJudgeScores | null;
  agentSessionId: string | undefined;
  error: string | undefined;
  artifactDir: string;
};

/**
 * Aggregated summary of a batch of trials for a single scenario.
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
  avgToolJudgeScores: Partial<Omit<ToolJudgeScores, 'reasoning'>> | null;
  trials: TrialResult[];
};

/**
 * Summary for a single scenario within a multi-scenario batch.
 * Extends BatchSummary with difficulty metadata.
 */
export type ScenarioSummary = BatchSummary & {
  difficulty: import('./scenarios/types').ScenarioDifficulty;
};

/**
 * Aggregated summary across multiple scenarios in a single batch run.
 */
export type MultiBatchSummary = {
  batchTimestamp: string;
  model: string;
  scenarios: ScenarioSummary[];
  aggregate: {
    totalTrials: number;
    overallSuccessRate: number;
    successRateByDifficulty: Record<string, number>;
    avgJudgeScores: Partial<Omit<JudgeScores, 'reasoning'>> | null;
    avgToolJudgeScores: Partial<Omit<ToolJudgeScores, 'reasoning'>> | null;
  };
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
