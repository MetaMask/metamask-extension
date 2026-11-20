/**
 * How many times slower Chrome runs the page's CPU work, read by the Chrome
 * driver. Unset or `1` runs at full speed. Chrome only: WebDriver BiDi has no
 * CPU emulation, so Firefox ignores it.
 */
export const CPU_THROTTLE_RATE_ENV = 'BENCHMARK_CPU_THROTTLE_RATE';

type WindowLocator = {
  window(handle: string): Promise<void>;
  newWindow(typeHint: string): Promise<unknown>;
};

export type ThrottleableDriver = {
  sendDevToolsCommand(command: string, params: object): Promise<void>;
  switchTo(): WindowLocator;
};

/**
 * The CPU slowdown requested through {@link CPU_THROTTLE_RATE_ENV}.
 *
 * @param env - The environment to read.
 * @returns The rate, or `undefined` when unset or `1`.
 */
export function getCpuThrottleRate(
  env: NodeJS.ProcessEnv = process.env,
): number | undefined {
  const raw = env[CPU_THROTTLE_RATE_ENV];
  if (raw === undefined || raw === '') {
    return undefined;
  }
  const rate = Number(raw);
  if (!Number.isFinite(rate) || rate < 1) {
    throw new Error(
      `${CPU_THROTTLE_RATE_ENV} must be a number of at least 1, got "${raw}"`,
    );
  }
  return rate === 1 ? undefined : rate;
}

/**
 * Slow the CPU of every window the driver works in by `rate`.
 *
 * Chrome holds the throttle per tab: it survives navigation, but a tab opened
 * later starts at full speed. So it is set again after every window switch.
 *
 * @param driver - The Chrome driver.
 * @param rate - How many times slower to run, at least 1.
 */
export async function throttleCpu(
  driver: ThrottleableDriver,
  rate: number,
): Promise<void> {
  const apply = () =>
    driver.sendDevToolsCommand('Emulation.setCPUThrottlingRate', { rate });
  await apply();

  const switchTo = driver.switchTo.bind(driver);
  driver.switchTo = () => {
    const locator = switchTo();
    const toWindow = locator.window.bind(locator);
    const toNewWindow = locator.newWindow.bind(locator);
    locator.window = async (handle) => {
      await toWindow(handle);
      await apply();
    };
    locator.newWindow = async (typeHint) => {
      const result = await toNewWindow(typeHint);
      await apply();
      return result;
    };
    return locator;
  };
}
