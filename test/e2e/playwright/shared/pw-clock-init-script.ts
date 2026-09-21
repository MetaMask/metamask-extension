/**
 * Stash native timers on Playwright's `__pwClock` hook before LavaMoat
 * scuttles `setInterval`. Required for `page.evaluate()` on extension pages.
 */
export function installPlaywrightClockBuiltins(): void {
  const global = globalThis as typeof globalThis & {
    // eslint-disable-next-line @typescript-eslint/naming-convention -- Playwright UtilityScript hook
    __pwClock?: { builtins: Record<string, unknown> };
  };
  if (global.__pwClock?.builtins) {
    return;
  }
  global.__pwClock = {
    builtins: {
      setTimeout: global.setTimeout.bind(global),
      clearTimeout: global.clearTimeout.bind(global),
      setInterval: global.setInterval.bind(global),
      clearInterval: global.clearInterval.bind(global),
      requestAnimationFrame: global.requestAnimationFrame?.bind(global),
      cancelAnimationFrame: global.cancelAnimationFrame?.bind(global),
      requestIdleCallback: global.requestIdleCallback?.bind(global),
      cancelIdleCallback: global.cancelIdleCallback?.bind(global),
      performance: global.performance,
      Intl: global.Intl,
      Date: global.Date,
      AbortSignal: global.AbortSignal,
    },
  };
}
