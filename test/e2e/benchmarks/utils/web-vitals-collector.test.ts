import type { Driver } from '../../webdriver/driver';
import type { WebVitalsMetrics } from './types';
import { collectWebVitals } from './web-vitals-collector';

function createMockDriver(overrides: {
  executeScript?: jest.Mock;
  executeAsyncScript?: jest.Mock;
}): Driver {
  return {
    executeScript: overrides.executeScript ?? jest.fn().mockResolvedValue(null),
    executeAsyncScript:
      overrides.executeAsyncScript ?? jest.fn().mockResolvedValue(null),
  } as unknown as Driver;
}

const fullMetrics: WebVitalsMetrics = {
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

describe('collectWebVitals', () => {
  describe('fast path (stateHooks)', () => {
    it('returns metrics from stateHooks when available', async () => {
      const driver = createMockDriver({
        executeScript: jest.fn().mockResolvedValue(fullMetrics),
      });

      const result = await collectWebVitals(driver);

      expect(result).toEqual(fullMetrics);
      expect(driver.executeScript).toHaveBeenCalledTimes(1);
      expect(driver.executeAsyncScript).not.toHaveBeenCalled();
    });

    it('returns stateHooks values when only some metrics are non-null', async () => {
      const partial: WebVitalsMetrics = {
        inp: 80,
        lcp: null,
        cls: null,
        inpRating: 'good',
        lcpRating: null,
        clsRating: null,
      };
      const driver = createMockDriver({
        executeScript: jest.fn().mockResolvedValue(partial),
      });

      const result = await collectWebVitals(driver);

      expect(result.inp).toBe(80);
      expect(driver.executeAsyncScript).not.toHaveBeenCalled();
    });
  });

  describe('fallback path (direct PerformanceObserver)', () => {
    it('falls back to executeAsyncScript when stateHooks return null', async () => {
      const observerResult: WebVitalsMetrics = {
        inp: 150,
        lcp: 1800,
        cls: 0.02,
        inpRating: 'good',
        lcpRating: 'good',
        clsRating: 'good',
      };
      const driver = createMockDriver({
        executeScript: jest.fn().mockResolvedValue(null),
        executeAsyncScript: jest.fn().mockResolvedValue(observerResult),
      });

      const result = await collectWebVitals(driver);

      expect(result).toEqual(observerResult);
      expect(driver.executeScript).toHaveBeenCalledTimes(1);
      expect(driver.executeAsyncScript).toHaveBeenCalledTimes(1);
      expect(driver.executeAsyncScript).toHaveBeenCalledWith(
        expect.stringContaining('PerformanceObserver'),
      );
    });

    it('returns null metrics when no observers produce data', async () => {
      const driver = createMockDriver({
        executeScript: jest.fn().mockResolvedValue(null),
        executeAsyncScript: jest.fn().mockResolvedValue(nullMetrics),
      });

      const result = await collectWebVitals(driver);

      expect(result).toEqual(nullMetrics);
    });

    it('returns CLS of 0 (valid) when layout-shift observer fires with no shifts', async () => {
      const zeroClsResult: WebVitalsMetrics = {
        inp: null,
        lcp: null,
        cls: 0,
        inpRating: null,
        lcpRating: null,
        clsRating: 'good',
      };
      const driver = createMockDriver({
        executeScript: jest.fn().mockResolvedValue(null),
        executeAsyncScript: jest.fn().mockResolvedValue(zeroClsResult),
      });

      const result = await collectWebVitals(driver);

      expect(result.cls).toBe(0);
      expect(result.clsRating).toBe('good');
    });
  });

  describe('script content', () => {
    it('passes an inline script string with PerformanceObserver setup', async () => {
      const driver = createMockDriver({
        executeScript: jest.fn().mockResolvedValue(null),
        executeAsyncScript: jest.fn().mockResolvedValue(nullMetrics),
      });

      await collectWebVitals(driver);

      const script = (driver.executeAsyncScript as jest.Mock).mock
        .calls[0][0] as string;
      expect(script).toContain('PerformanceObserver');
      expect(script).toContain("type: 'event'");
      expect(script).toContain("type: 'largest-contentful-paint'");
      expect(script).toContain("type: 'layout-shift'");
      expect(script).toContain('buffered: true');
      expect(script).toContain('setTimeout');
    });
  });
});
