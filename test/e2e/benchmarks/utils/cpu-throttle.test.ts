import {
  CPU_THROTTLE_RATE_ENV,
  getCpuThrottleRate,
  throttleCpu,
  type ThrottleableDriver,
} from './cpu-throttle';

const THROTTLE = 'Emulation.setCPUThrottlingRate';

// Like selenium's `switchTo()`, each call returns a fresh locator.
function createDriver() {
  const commands: [string, object][] = [];
  const toWindow = jest.fn(async (_handle: string) => undefined);
  const toNewWindow = jest.fn(async (_typeHint: string) => ({
    handle: 'new',
  }));
  const driver: ThrottleableDriver = {
    sendDevToolsCommand: jest.fn(async (command: string, params: object) => {
      commands.push([command, params]);
    }),
    switchTo: () => ({ window: toWindow, newWindow: toNewWindow }),
  };
  return { driver, commands, toWindow };
}

describe('getCpuThrottleRate', () => {
  it('returns undefined when unset, empty or 1', () => {
    expect(getCpuThrottleRate({})).toBeUndefined();
    expect(getCpuThrottleRate({ [CPU_THROTTLE_RATE_ENV]: '' })).toBeUndefined();
    expect(
      getCpuThrottleRate({ [CPU_THROTTLE_RATE_ENV]: '1' }),
    ).toBeUndefined();
  });

  it('returns the rate when above 1', () => {
    expect(getCpuThrottleRate({ [CPU_THROTTLE_RATE_ENV]: '2' })).toBe(2);
    expect(getCpuThrottleRate({ [CPU_THROTTLE_RATE_ENV]: '1.5' })).toBe(1.5);
  });

  for (const raw of ['0.5', '0', '-2', 'fast', 'NaN', 'Infinity']) {
    it(`throws on ${raw}`, () => {
      expect(() =>
        getCpuThrottleRate({ [CPU_THROTTLE_RATE_ENV]: raw }),
      ).toThrow(CPU_THROTTLE_RATE_ENV);
    });
  }
});

describe('throttleCpu', () => {
  it('throttles the current window', async () => {
    const { driver, commands } = createDriver();

    await throttleCpu(driver, 2);

    expect(commands).toStrictEqual([[THROTTLE, { rate: 2 }]]);
  });

  it('throttles again after switching to a window', async () => {
    const { driver, commands, toWindow } = createDriver();
    await throttleCpu(driver, 2);

    await driver.switchTo().window('other');
    await driver.switchTo().window('first');

    expect(toWindow.mock.calls).toStrictEqual([['other'], ['first']]);
    expect(commands).toStrictEqual([
      [THROTTLE, { rate: 2 }],
      [THROTTLE, { rate: 2 }],
      [THROTTLE, { rate: 2 }],
    ]);
  });

  it('throttles a new window and returns what the driver returned', async () => {
    const { driver, commands } = createDriver();
    await throttleCpu(driver, 4);

    const result = await driver.switchTo().newWindow('tab');

    expect(result).toStrictEqual({ handle: 'new' });
    expect(commands).toStrictEqual([
      [THROTTLE, { rate: 4 }],
      [THROTTLE, { rate: 4 }],
    ]);
  });
});
