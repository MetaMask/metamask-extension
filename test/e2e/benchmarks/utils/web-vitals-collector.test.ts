import type { Driver } from '../../webdriver/driver';
import type { WebVitalsMetrics } from './types';
import { collectWebVitals } from './web-vitals-collector';

describe('collectWebVitals', () => {
  function createMockDriver(
    scriptResult: WebVitalsMetrics,
  ): Driver {
    return {
      executeScript: jest.fn().mockResolvedValue(scriptResult),
    } as unknown as Driver;
  }

  const metricsWithData: WebVitalsMetrics = {
    inp: 120,
    lcp: 2400,
    cls: 0.05,
    inpRating: 'good',
    lcpRating: 'good',
    clsRating: 'good',
  };

  const nullMetrics: WebVitalsMetrics = {
    inp: null,
    lcp: null,
    cls: null,
    inpRating: null,
    lcpRating: null,
    clsRating: null,
  };

  it('returns metrics from driver.executeScript', async () => {
    const driver = createMockDriver(metricsWithData);
    const result = await collectWebVitals(driver);

    expect(result).toEqual(metricsWithData);
    expect(driver.executeScript).toHaveBeenCalledTimes(1);
  });

  it('returns null metrics when stateHooks are unavailable', async () => {
    const driver = createMockDriver(nullMetrics);
    const result = await collectWebVitals(driver);

    expect(result).toEqual(nullMetrics);
  });

  it('returns partial metrics when only some observers fire', async () => {
    const partialMetrics: WebVitalsMetrics = {
      inp: 80,
      lcp: null,
      cls: null,
      inpRating: 'good',
      lcpRating: null,
      clsRating: null,
    };
    const driver = createMockDriver(partialMetrics);
    const result = await collectWebVitals(driver);

    expect(result.inp).toBe(80);
    expect(result.inpRating).toBe('good');
    expect(result.lcp).toBeNull();
    expect(result.cls).toBeNull();
  });

  it('passes a function to executeScript', async () => {
    const driver = createMockDriver(nullMetrics);
    await collectWebVitals(driver);

    expect(driver.executeScript).toHaveBeenCalledWith(expect.any(Function));
  });
});
