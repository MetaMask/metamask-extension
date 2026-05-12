import type { EvalScore, EvalContext } from './types';
import { extractToolCalls, extractToolResults } from './log-parser';
import { evaluate as screenshotEfficiency } from './screenshot-efficiency';
import { evaluate as describeScreenLoops } from './describe-screen-loops';
import { evaluate as tokenEfficiency } from './token-efficiency';
import { evaluate as staleRefUsage } from './stale-ref-usage';

export type { EvalScore, EvalContext };

export type DeterministicEvalParams = {
  conversationLog: string[];
  turns: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  traceId: string | undefined;
};

const evaluators = [
  screenshotEfficiency,
  describeScreenLoops,
  tokenEfficiency,
  staleRefUsage,
];

export function runDeterministicEvals(
  params: DeterministicEvalParams,
): EvalScore[] {
  const ctx: EvalContext = {
    conversationLog: params.conversationLog,
    turns: params.turns,
    totalInputTokens: params.totalInputTokens,
    totalOutputTokens: params.totalOutputTokens,
    toolCalls: extractToolCalls(params.conversationLog),
    toolResults: extractToolResults(params.conversationLog),
  };

  return evaluators.map((evaluate) => evaluate(ctx));
}
