import type { EvalScore, EvalContext } from './types';

// <5K per turn is efficient, >20K is wasteful (large describe-screen outputs inflate this)
const THRESHOLDS = [
  { maxTokensPerTurn: 5000, score: 1.0 },
  { maxTokensPerTurn: 10000, score: 0.8 },
  { maxTokensPerTurn: 20000, score: 0.6 },
];
const FLOOR_SCORE = 0.4;

export function evaluate(ctx: EvalContext): EvalScore {
  const totalTokens = ctx.totalInputTokens + ctx.totalOutputTokens;
  const tokensPerTurn = ctx.turns > 0 ? totalTokens / ctx.turns : 0;

  const score =
    THRESHOLDS.find((t) => tokensPerTurn <= t.maxTokensPerTurn)?.score ??
    FLOOR_SCORE;

  return {
    name: 'token_efficiency',
    value: score,
    comment: `${totalTokens} total tokens across ${ctx.turns} turns (${Math.round(tokensPerTurn)}/turn)`,
  };
}
