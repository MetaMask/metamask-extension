import type { EvalScore, EvalContext } from './types';

export function evaluate(ctx: EvalContext): EvalScore {
  let screenshotCount = 0;
  let usefulScreenshots = 0;

  for (let i = 0; i < ctx.toolCalls.length; i++) {
    if (!ctx.toolCalls[i].includes('mm screenshot')) continue;
    screenshotCount++;

    const nextAction = ctx.toolCalls.slice(i + 1).find(
      (c) =>
        c.includes('mm click') ||
        c.includes('mm type') ||
        c.includes('mm navigate'),
    );
    if (nextAction) usefulScreenshots++;
  }

  if (screenshotCount === 0) {
    return {
      name: 'screenshot_efficiency',
      value: 1.0,
      comment: 'No screenshots taken',
    };
  }

  const ratio = usefulScreenshots / screenshotCount;
  return {
    name: 'screenshot_efficiency',
    value: Math.round(ratio * 100) / 100,
    comment: `${usefulScreenshots}/${screenshotCount} screenshots followed by an action`,
  };
}
