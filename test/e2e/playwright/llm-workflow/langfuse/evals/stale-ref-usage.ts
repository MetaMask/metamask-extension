import type { EvalScore, EvalContext } from './types';

export function evaluate(ctx: EvalContext): EvalScore {
  let clicksAfterDescribe = 0;
  let clicksWithoutDescribe = 0;
  let lastWasDescribe = false;

  for (const call of ctx.toolCalls) {
    if (call.includes('mm describe-screen')) {
      lastWasDescribe = true;
      continue;
    }
    if (call.includes('mm click') || call.includes('mm type')) {
      if (lastWasDescribe) {
        clicksAfterDescribe++;
      } else {
        clicksWithoutDescribe++;
      }
      lastWasDescribe = false;
    }
  }

  const failedClicks = ctx.toolResults.filter(
    (r) => r.tool === 'Bash' && r.isError,
  ).length;

  const totalInteractions = clicksAfterDescribe + clicksWithoutDescribe;
  if (totalInteractions === 0) {
    return {
      name: 'stale_ref_usage',
      value: 1.0,
      comment: 'No click/type interactions',
    };
  }

  const freshRatio = clicksAfterDescribe / totalInteractions;
  const failurePenalty = failedClicks * 0.1;
  const score = Math.max(
    0,
    Math.round((freshRatio - failurePenalty) * 100) / 100,
  );

  return {
    name: 'stale_ref_usage',
    value: score,
    comment: `${clicksAfterDescribe}/${totalInteractions} interactions used fresh refs, ${failedClicks} failures`,
  };
}
