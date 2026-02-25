import type { Driver } from '../../webdriver/driver';
import type { WebVitalsMetrics } from './types';
import { collectWebVitals } from './web-vitals-collector';

function createMockDriver(overrides: {
  executeScript?: jest.Mock;
  delay?: jest.Mock;
  innerSendDevToolsCommand?: jest.Mock | null;
}): Driver {
  const driver = {
    executeScript: overrides.executeScript ?? jest.fn().mockResolvedValue(null),
    delay: overrides.delay ?? jest.fn().mockResolvedValue(undefined),
    driver:
      overrides.innerSendDevToolsCommand === null
        ? undefined
        : {
            sendDevToolsCommand:
              overrides.innerSendDevToolsCommand ??
              jest.fn().mockResolvedValue(undefined),
          },
  } as unknown as Driver;
  return driver;
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
      expect(driver.executeScript).toHaveBeenCalledTimes(1);
    });

    it('does not invoke CDP probe or delay on the fast path', async () => {
      const sendCmd = jest.fn().mockResolvedValue(undefined);
      const delay = jest.fn().mockResolvedValue(undefined);
      const driver = createMockDriver({
        executeScript: jest.fn().mockResolvedValue(fullMetrics),
        delay,
        innerSendDevToolsCommand: sendCmd,
      });

      await collectWebVitals(driver);

      expect(sendCmd).not.toHaveBeenCalled();
      expect(delay).not.toHaveBeenCalled();
    });
  });

  describe('CDP probe path', () => {
    it('dispatches Shift keyDown + keyUp via CDP on the fallback path', async () => {
      const sendCmd = jest.fn().mockResolvedValue(undefined);
      const readResult: WebVitalsMetrics = {
        inp: 16,
        lcp: 151,
        cls: 0,
        inpRating: 'good',
        lcpRating: 'good',
        clsRating: 'good',
      };
      const execScript = jest
        .fn()
        .mockResolvedValueOnce(null) // Phase 1: stateHooks miss
        .mockResolvedValueOnce(undefined) // Phase 2: setup
        .mockResolvedValueOnce(readResult); // Phase 5: read

      const driver = createMockDriver({
        executeScript: execScript,
        innerSendDevToolsCommand: sendCmd,
      });

      const result = await collectWebVitals(driver);

      expect(result).toEqual(readResult);
      expect(sendCmd).toHaveBeenCalledTimes(2);
      expect(sendCmd).toHaveBeenCalledWith(
        'Input.dispatchKeyEvent',
        expect.objectContaining({ type: 'keyDown', key: 'Shift' }),
      );
      expect(sendCmd).toHaveBeenCalledWith(
        'Input.dispatchKeyEvent',
        expect.objectContaining({ type: 'keyUp', key: 'Shift' }),
      );
    });

    it('calls delay(200) between CDP probe and read', async () => {
      const delay = jest.fn().mockResolvedValue(undefined);
      const callOrder: string[] = [];

      const sendCmd = jest.fn().mockImplementation(async () => {
        callOrder.push('cdp');
      });
      delay.mockImplementation(async () => {
        callOrder.push('delay');
      });

      const execScript = jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockImplementationOnce(async () => {
          callOrder.push('setup');
        })
        .mockImplementationOnce(async () => {
          callOrder.push('read');
          return nullMetrics;
        });

      const driver = createMockDriver({
        executeScript: execScript,
        delay,
        innerSendDevToolsCommand: sendCmd,
      });

      await collectWebVitals(driver);

      expect(delay).toHaveBeenCalledWith(200);
      expect(callOrder).toEqual(['setup', 'cdp', 'cdp', 'delay', 'read']);
    });

    it('executes 3 scripts total on fallback: stateHooks, setup, read', async () => {
      const execScript = jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(nullMetrics);

      const driver = createMockDriver({ executeScript: execScript });

      await collectWebVitals(driver);

      expect(execScript).toHaveBeenCalledTimes(3);
    });
  });

  describe('CDP unavailable (graceful degradation)', () => {
    it('returns metrics even when sendDevToolsCommand throws', async () => {
      const sendCmd = jest.fn().mockRejectedValue(new Error('CDP gone'));
      const execScript = jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(nullMetrics);

      const driver = createMockDriver({
        executeScript: execScript,
        innerSendDevToolsCommand: sendCmd,
      });

      const result = await collectWebVitals(driver);

      expect(result).toEqual(nullMetrics);
    });

    it('works when inner driver has no sendDevToolsCommand', async () => {
      const execScript = jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(nullMetrics);

      const driver = createMockDriver({
        executeScript: execScript,
        innerSendDevToolsCommand: null,
      });

      const result = await collectWebVitals(driver);

      expect(result).toEqual(nullMetrics);
    });
  });

  describe('script content', () => {
    it('setup script creates PerformanceObservers and reads FCP', async () => {
      const execScript = jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(nullMetrics);

      const driver = createMockDriver({ executeScript: execScript });

      await collectWebVitals(driver);

      const setupScript = execScript.mock.calls[1][0] as string;
      expect(setupScript).toContain('PerformanceObserver');
      expect(setupScript).toContain("type: 'event'");
      expect(setupScript).toContain("type: 'largest-contentful-paint'");
      expect(setupScript).toContain("type: 'layout-shift'");
      expect(setupScript).toContain('buffered: true');
      expect(setupScript).toContain('first-contentful-paint');
      expect(setupScript).toContain('__cwv');
    });

    it('read script computes metrics and cleans up', async () => {
      const execScript = jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(nullMetrics);

      const driver = createMockDriver({ executeScript: execScript });

      await collectWebVitals(driver);

      const readScript = execScript.mock.calls[2][0] as string;
      expect(readScript).toContain('window.__cwv');
      expect(readScript).toContain('return result');
      expect(readScript).toContain('disconnect');
      expect(readScript).toContain('delete window.__cwv');
      expect(readScript).toContain('cwv.fcp');
    });
  });

  describe('FCP-as-LCP fallback', () => {
    it('read script references fcp as LCP fallback', async () => {
      const execScript = jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({
          inp: null,
          lcp: 151,
          cls: 0,
          inpRating: null,
          lcpRating: 'good',
          clsRating: 'good',
        });

      const driver = createMockDriver({ executeScript: execScript });

      const result = await collectWebVitals(driver);

      expect(result.lcp).toBe(151);
      expect(result.lcpRating).toBe('good');

      const readScript = execScript.mock.calls[2][0] as string;
      expect(readScript).toContain('result.lcp === null && cwv.fcp !== null');
    });
  });

  describe('zero-fallbacks', () => {
    it('INP falls back to 0 when Event Timing API has no entries', async () => {
      const execScript = jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({
          inp: 0,
          lcp: null,
          cls: 0,
          inpRating: 'good',
          lcpRating: null,
          clsRating: 'good',
        });

      const driver = createMockDriver({ executeScript: execScript });
      const result = await collectWebVitals(driver);

      expect(result.inp).toBe(0);
      expect(result.inpRating).toBe('good');
    });

    it('CLS falls back to 0 when layout-shift observer is unsupported', async () => {
      const execScript = jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({
          inp: 0,
          lcp: null,
          cls: 0,
          inpRating: 'good',
          lcpRating: null,
          clsRating: 'good',
        });

      const driver = createMockDriver({ executeScript: execScript });
      const result = await collectWebVitals(driver);

      expect(result.cls).toBe(0);
      expect(result.clsRating).toBe('good');
    });

    it('read script contains INP = 0 fallback', async () => {
      const execScript = jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(nullMetrics);

      const driver = createMockDriver({ executeScript: execScript });
      await collectWebVitals(driver);

      const readScript = execScript.mock.calls[2][0] as string;
      expect(readScript).toContain('result.inp === null');
      expect(readScript).toContain('result.inp = 0');
      expect(readScript).toContain('result.inpRating = rate(maxDur');
    });

    it('read script contains CLS = 0 fallback', async () => {
      const execScript = jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(nullMetrics);

      const driver = createMockDriver({ executeScript: execScript });
      await collectWebVitals(driver);

      const readScript = execScript.mock.calls[2][0] as string;
      expect(readScript).toContain('result.cls === null');
      expect(readScript).toContain('result.cls = 0');
    });
  });

  describe('busy-wait keydown handler', () => {
    it('setup script registers a busy-wait keydown handler', async () => {
      const execScript = jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(nullMetrics);

      const driver = createMockDriver({ executeScript: execScript });
      await collectWebVitals(driver);

      const setupScript = execScript.mock.calls[1][0] as string;
      expect(setupScript).toContain('busyWait');
      expect(setupScript).toContain('keydown');
      expect(setupScript).toContain('performance.now()');
      expect(setupScript).toContain('once: true');
    });

    it('busy-wait targets 16ms duration', async () => {
      const execScript = jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(nullMetrics);

      const driver = createMockDriver({ executeScript: execScript });
      await collectWebVitals(driver);

      const setupScript = execScript.mock.calls[1][0] as string;
      expect(setupScript).toContain('+ 16');
    });
  });

  describe('maxDur > 0 guard removed', () => {
    it('read script does not gate INP on maxDur > 0', async () => {
      const execScript = jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(nullMetrics);

      const driver = createMockDriver({ executeScript: execScript });
      await collectWebVitals(driver);

      const readScript = execScript.mock.calls[2][0] as string;
      expect(readScript).not.toContain('if (maxDur > 0)');
    });

    it('INP is set even when all event durations are 0', async () => {
      const execScript = jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({
          inp: 0,
          lcp: 500,
          cls: 0,
          inpRating: 'good',
          lcpRating: 'good',
          clsRating: 'good',
        });

      const driver = createMockDriver({ executeScript: execScript });
      const result = await collectWebVitals(driver);

      expect(result.inp).toBe(0);
      expect(result.inp).not.toBeNull();
      expect(result.inpRating).toBe('good');
    });
  });

  describe('non-null output via fallback path', () => {
    function makeFallbackDriver(readResult: WebVitalsMetrics) {
      return createMockDriver({
        executeScript: jest
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(undefined)
          .mockResolvedValueOnce(readResult),
      });
    }

    it('returns all three metrics non-null with correct ratings', async () => {
      const result = await collectWebVitals(
        makeFallbackDriver({
          inp: 90,
          lcp: 1800,
          cls: 0.02,
          inpRating: 'good',
          lcpRating: 'good',
          clsRating: 'good',
        }),
      );

      expect(result.inp).toBe(90);
      expect(result.lcp).toBe(1800);
      expect(result.cls).toBe(0.02);
      expect(result.inpRating).toBe('good');
      expect(result.lcpRating).toBe('good');
      expect(result.clsRating).toBe('good');
    });

    it('returns CLS of exactly 0 as non-null', async () => {
      const result = await collectWebVitals(
        makeFallbackDriver({
          inp: 50,
          lcp: 500,
          cls: 0,
          inpRating: 'good',
          lcpRating: 'good',
          clsRating: 'good',
        }),
      );

      expect(result.cls).toBe(0);
      expect(result.cls).not.toBeNull();
      expect(result.clsRating).toBe('good');
    });

    describe('INP rating thresholds', () => {
      it.each([
        { inp: 200, expected: 'good' },
        { inp: 201, expected: 'needs-improvement' },
        { inp: 500, expected: 'needs-improvement' },
        { inp: 501, expected: 'poor' },
      ])('INP $inp ms → $expected', async ({ inp, expected }) => {
        const result = await collectWebVitals(
          makeFallbackDriver({
            inp,
            lcp: null,
            cls: null,
            inpRating: expected as WebVitalsMetrics['inpRating'],
            lcpRating: null,
            clsRating: null,
          }),
        );

        expect(result.inp).toBe(inp);
        expect(result.inpRating).toBe(expected);
      });
    });

    describe('LCP rating thresholds', () => {
      it.each([
        { lcp: 2500, expected: 'good' },
        { lcp: 2501, expected: 'needs-improvement' },
        { lcp: 4000, expected: 'needs-improvement' },
        { lcp: 4001, expected: 'poor' },
      ])('LCP $lcp ms → $expected', async ({ lcp, expected }) => {
        const result = await collectWebVitals(
          makeFallbackDriver({
            inp: null,
            lcp,
            cls: null,
            inpRating: null,
            lcpRating: expected as WebVitalsMetrics['lcpRating'],
            clsRating: null,
          }),
        );

        expect(result.lcp).toBe(lcp);
        expect(result.lcpRating).toBe(expected);
      });
    });

    describe('CLS rating thresholds', () => {
      it.each([
        { cls: 0.1, expected: 'good' },
        { cls: 0.11, expected: 'needs-improvement' },
        { cls: 0.25, expected: 'needs-improvement' },
        { cls: 0.26, expected: 'poor' },
      ])('CLS $cls → $expected', async ({ cls, expected }) => {
        const result = await collectWebVitals(
          makeFallbackDriver({
            inp: null,
            lcp: null,
            cls,
            inpRating: null,
            lcpRating: null,
            clsRating: expected as WebVitalsMetrics['clsRating'],
          }),
        );

        expect(result.cls).toBe(cls);
        expect(result.clsRating).toBe(expected);
      });
    });

    describe('partial non-null combinations', () => {
      it('INP + LCP non-null, CLS null', async () => {
        const result = await collectWebVitals(
          makeFallbackDriver({
            inp: 16,
            lcp: 300,
            cls: null,
            inpRating: 'good',
            lcpRating: 'good',
            clsRating: null,
          }),
        );

        expect(result.inp).toBe(16);
        expect(result.lcp).toBe(300);
        expect(result.cls).toBeNull();
      });

      it('INP + CLS non-null, LCP null', async () => {
        const result = await collectWebVitals(
          makeFallbackDriver({
            inp: 250,
            lcp: null,
            cls: 0.05,
            inpRating: 'needs-improvement',
            lcpRating: null,
            clsRating: 'good',
          }),
        );

        expect(result.inp).toBe(250);
        expect(result.lcp).toBeNull();
        expect(result.cls).toBe(0.05);
      });

      it('LCP + CLS non-null, INP null', async () => {
        const result = await collectWebVitals(
          makeFallbackDriver({
            inp: null,
            lcp: 3500,
            cls: 0.2,
            inpRating: null,
            lcpRating: 'needs-improvement',
            clsRating: 'needs-improvement',
          }),
        );

        expect(result.inp).toBeNull();
        expect(result.lcp).toBe(3500);
        expect(result.lcpRating).toBe('needs-improvement');
        expect(result.cls).toBe(0.2);
        expect(result.clsRating).toBe('needs-improvement');
      });

      it('only INP non-null', async () => {
        const result = await collectWebVitals(
          makeFallbackDriver({
            inp: 600,
            lcp: null,
            cls: null,
            inpRating: 'poor',
            lcpRating: null,
            clsRating: null,
          }),
        );

        expect(result.inp).toBe(600);
        expect(result.inpRating).toBe('poor');
        expect(result.lcp).toBeNull();
        expect(result.cls).toBeNull();
      });
    });
  });

  describe('non-null output via stateHooks fast path', () => {
    it('returns all metrics non-null from stateHooks', async () => {
      const metrics: WebVitalsMetrics = {
        inp: 45,
        lcp: 1200,
        cls: 0.001,
        inpRating: 'good',
        lcpRating: 'good',
        clsRating: 'good',
      };
      const driver = createMockDriver({
        executeScript: jest.fn().mockResolvedValue(metrics),
      });

      const result = await collectWebVitals(driver);

      expect(result.inp).not.toBeNull();
      expect(result.lcp).not.toBeNull();
      expect(result.cls).not.toBeNull();
      expect(result).toEqual(metrics);
    });

    it('returns partial non-null from stateHooks without falling back', async () => {
      const partial: WebVitalsMetrics = {
        inp: null,
        lcp: 2000,
        cls: null,
        inpRating: null,
        lcpRating: 'good',
        clsRating: null,
      };
      const driver = createMockDriver({
        executeScript: jest.fn().mockResolvedValue(partial),
      });

      const result = await collectWebVitals(driver);

      expect(result.lcp).toBe(2000);
      expect(result.lcpRating).toBe('good');
      expect(driver.executeScript).toHaveBeenCalledTimes(1);
    });

    it('preserves poor ratings from stateHooks', async () => {
      const poor: WebVitalsMetrics = {
        inp: 800,
        lcp: 5000,
        cls: 0.3,
        inpRating: 'poor',
        lcpRating: 'poor',
        clsRating: 'poor',
      };
      const driver = createMockDriver({
        executeScript: jest.fn().mockResolvedValue(poor),
      });

      const result = await collectWebVitals(driver);

      expect(result.inpRating).toBe('poor');
      expect(result.lcpRating).toBe('poor');
      expect(result.clsRating).toBe('poor');
    });
  });
});
