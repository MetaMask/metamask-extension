import type { EvalScore, EvalContext } from './types';

export function evaluate(ctx: EvalContext): EvalScore {
  let consecutiveDescribes = 0;
  let maxConsecutive = 0;
  let loopCount = 0;

  for (const call of ctx.toolCalls) {
    if (call.includes('mm describe-screen')) {
      consecutiveDescribes++;
      if (consecutiveDescribes > maxConsecutive) {
        maxConsecutive = consecutiveDescribes;
      }
    } else {
      if (consecutiveDescribes >= 2) loopCount++;
      consecutiveDescribes = 0;
    }
  }
  if (consecutiveDescribes >= 2) loopCount++;

  if (loopCount === 0) {
    return {
      name: 'describe_screen_loops',
      value: 1.0,
      comment: 'No consecutive describe-screen calls without actions',
    };
  }

  const score = Math.max(0, 1.0 - loopCount * 0.2);
  return {
    name: 'describe_screen_loops',
    value: Math.round(score * 100) / 100,
    comment: `${loopCount} loop(s) detected, max ${maxConsecutive} consecutive describe-screen calls`,
  };
}
