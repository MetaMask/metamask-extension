import type { Driver } from '../../webdriver/driver';
import type TokensTab from '../../page-objects/pages/home/tokens-tab';
import {
  PRICE_CHART_DATA,
  measureAssetClickToPriceChart,
} from './asset-price-chart-step';
import { measureStepInPage } from './in-page-step-timer';
import { measureStepWithLongTasks } from './long-task-helper';
import type { LongTaskStepResult } from './types';

jest.mock('./in-page-step-timer', () => ({
  measureStepInPage: jest.fn(),
}));
jest.mock('./long-task-helper', () => ({
  measureStepWithLongTasks: jest.fn(),
}));

const STEP: LongTaskStepResult = {
  id: 'assetClickToPriceChart',
  duration: 700,
  longTaskCount: 1,
  longTaskTotalDuration: 80,
  longTaskMaxDuration: 80,
  tbt: 30,
  longTasksObserved: true,
};

/**
 * Run the helper over a `measureStepInPage` that runs the click and then the
 * timed wait, as the real one does.
 * @returns What the flows pass on, and the calls the helper made.
 */
async function run() {
  const calls: string[] = [];
  const driver = {
    waitForSelector: jest.fn(async () => {
      calls.push('driver.waitForSelector');
    }),
  } as unknown as Driver;
  const tokensTab = {
    clickOnAsset: jest.fn(async () => {
      calls.push('clickOnAsset');
    }),
    checkPriceChartIsShown: jest.fn(async () => {
      calls.push('checkPriceChartIsShown');
    }),
  } as unknown as TokensTab;
  (measureStepInPage as jest.Mock).mockImplementation(
    async (
      _driver: Driver,
      _stepId: string,
      {
        trigger,
        settle,
      }: { trigger: () => Promise<void>; settle: () => Promise<void> },
    ) => {
      await trigger();
      await settle();
      return [{ id: 'assetClickToPriceChart', value: 5, unit: 'ms' }];
    },
  );
  (measureStepWithLongTasks as jest.Mock).mockImplementation(
    async (_driver: Driver, _stepId: string, action: () => Promise<void>) => {
      await action();
      return STEP;
    },
  );
  const steps: LongTaskStepResult[] = [];

  const timers = await measureAssetClickToPriceChart(
    driver,
    tokensTab,
    'Solana',
    steps,
  );
  return { timers, steps, calls, tokensTab };
}

describe('measureAssetClickToPriceChart', () => {
  it('opens the long-task window at the click, and has the step read whether the probe did', async () => {
    await run();

    const [, stepId, options] = (measureStepInPage as jest.Mock).mock.calls[0];
    expect(stepId).toBe('assetClickToPriceChart');
    expect(options).toMatchObject({
      endSelector: PRICE_CHART_DATA,
      resetLongTasksAtStart: true,
    });
    const [, , , stepOptions] = (measureStepWithLongTasks as jest.Mock).mock
      .calls[0];
    expect(stepOptions).toStrictEqual({
      legacyTimerId: true,
      windowOpensAtTrigger: true,
    });
  });

  it('clicks the named asset, then waits for the chart and its data', async () => {
    const { calls, tokensTab } = await run();

    expect(tokensTab.clickOnAsset).toHaveBeenCalledWith('Solana');
    expect(calls).toStrictEqual([
      'clickOnAsset',
      'checkPriceChartIsShown',
      'driver.waitForSelector',
    ]);
  });

  it("hands back the step's long-task result and the in-page timers", async () => {
    const { timers, steps } = await run();

    expect(steps).toStrictEqual([STEP]);
    expect(timers).toStrictEqual([
      { id: 'assetClickToPriceChart', value: 5, unit: 'ms' },
    ]);
  });
});
