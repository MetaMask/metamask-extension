/**
 * Times slower Chrome runs page CPU work; unset or `1` is full speed. Firefox
 * ignores it, as WebDriver BiDi has no CPU emulation.
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
 * @param env - The environment to read {@link CPU_THROTTLE_RATE_ENV} from.
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
 * A tab opened later starts at full speed, so the throttle is set again after
 * every window switch.
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
