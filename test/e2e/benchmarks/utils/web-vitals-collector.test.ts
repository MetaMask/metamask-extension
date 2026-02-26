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
  fcp: 280,
  lcp: null,
  cls: 0.05,
  inpRating: 'good',
  fcpRating: 'good',
  lcpRating: null,
  clsRating: 'good',
};

const nullMetrics: WebVitalsMetrics = {
  inp: null,
  fcp: null,
  lcp: null,
  cls: null,
  inpRating: null,
  fcpRating: null,
  lcpRating: null,
  clsRating: null,
};

function makeReadResult(
  overrides: Partial<WebVitalsMetrics> = {},
): WebVitalsMetrics {
  return { ...nullMetrics, ...overrides };
}

describe('collectWebVitals', () => {
  describe('execution flow', () => {
    it('executes 2 scripts: setup and read', async () => {
      const execScript = jest
        .fn()
        .mockResolvedValueOnce(undefined) // setup
        .mockResolvedValueOnce(fullMetrics); // read

      const driver = createMockDriver({ executeScript: execScript });
      await collectWebVitals(driver);

      expect(execScript).toHaveBeenCalledTimes(2);
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
        .mockImplementationOnce(async () => {
          callOrder.push('setup');
        })
        .mockImplementationOnce(async () => {
          callOrder.push('read');
          return fullMetrics;
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
  });

  describe('CDP probe', () => {
    it('dispatches Shift keyDown + keyUp via CDP', async () => {
      const sendCmd = jest.fn().mockResolvedValue(undefined);
      const execScript = jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(fullMetrics);

      const driver = createMockDriver({
        executeScript: execScript,
        innerSendDevToolsCommand: sendCmd,
      });

      await collectWebVitals(driver);

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
  });

  describe('CDP unavailable (graceful degradation)', () => {
    it('returns metrics even when sendDevToolsCommand throws', async () => {
      const sendCmd = jest.fn().mockRejectedValue(new Error('CDP gone'));
      const execScript = jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(fullMetrics);

      const driver = createMockDriver({
        executeScript: execScript,
        innerSendDevToolsCommand: sendCmd,
      });

      const result = await collectWebVitals(driver);
      expect(result).toEqual(fullMetrics);
    });

    it('works when inner driver has no sendDevToolsCommand', async () => {
      const execScript = jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(fullMetrics);

      const driver = createMockDriver({
        executeScript: execScript,
        innerSendDevToolsCommand: null,
      });

      const result = await collectWebVitals(driver);
      expect(result).toEqual(fullMetrics);
    });
  });

  describe('script content', () => {
    it('setup script creates PerformanceObservers and reads FCP', async () => {
      const execScript = jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(nullMetrics);

      const driver = createMockDriver({ executeScript: execScript });
      await collectWebVitals(driver);

      const setupScript = execScript.mock.calls[0][0] as string;
      expect(setupScript).toContain('PerformanceObserver');
      expect(setupScript).toContain("type: 'event'");
      expect(setupScript).toContain("type: 'largest-contentful-paint'");
      expect(setupScript).toContain("type: 'element'");
      expect(setupScript).toContain("type: 'layout-shift'");
      expect(setupScript).toContain('buffered: true');
      expect(setupScript).toContain('first-contentful-paint');
      expect(setupScript).toContain('__cwv');
    });

    it('read script computes metrics and cleans up', async () => {
      const execScript = jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(nullMetrics);

      const driver = createMockDriver({ executeScript: execScript });
      await collectWebVitals(driver);

      const readScript = execScript.mock.calls[1][0] as string;
      expect(readScript).toContain('window.__cwv');
      expect(readScript).toContain('return result');
      expect(readScript).toContain('disconnect');
      expect(readScript).toContain('delete window.__cwv');
    });

    it('read script populates FCP from paint entries', async () => {
      const execScript = jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(nullMetrics);

      const driver = createMockDriver({ executeScript: execScript });
      await collectWebVitals(driver);

      const readScript = execScript.mock.calls[1][0] as string;
      expect(readScript).toContain('result.fcp = cwv.fcp');
      expect(readScript).toContain('result.fcpRating');
    });

    it('read script does NOT fall back from FCP to LCP', async () => {
      const execScript = jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(nullMetrics);

      const driver = createMockDriver({ executeScript: execScript });
      await collectWebVitals(driver);

      const readScript = execScript.mock.calls[1][0] as string;
      expect(readScript).not.toContain('result.lcp = cwv.fcp');
    });

    it('read script uses Element Timing as LCP fallback', async () => {
      const execScript = jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(nullMetrics);

      const driver = createMockDriver({ executeScript: execScript });
      await collectWebVitals(driver);

      const readScript = execScript.mock.calls[1][0] as string;
      expect(readScript).toContain('cwv.element.length > 0');
      expect(readScript).toContain('renderTime');
      expect(readScript).toContain('loadTime');
    });

    it('read script checks stateHooks for INP/LCP/CLS', async () => {
      const execScript = jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(nullMetrics);

      const driver = createMockDriver({ executeScript: execScript });
      await collectWebVitals(driver);

      const readScript = execScript.mock.calls[1][0] as string;
      expect(readScript).toContain('stateHooks');
      expect(readScript).toContain('getWebVitalsMetrics');
      expect(readScript).toContain('resetWebVitalsMetrics');
    });
  });

  describe('FCP and LCP as separate metrics', () => {
    it('returns FCP independently from LCP', async () => {
      const result = await collectWebVitals(
        createMockDriver({
          executeScript: jest
            .fn()
            .mockResolvedValueOnce(undefined)
            .mockResolvedValueOnce(
              makeReadResult({ fcp: 280, fcpRating: 'good', lcp: null }),
            ),
        }),
      );

      expect(result.fcp).toBe(280);
      expect(result.fcpRating).toBe('good');
      expect(result.lcp).toBeNull();
    });

    it('returns LCP from real largest-contentful-paint entries', async () => {
      const result = await collectWebVitals(
        createMockDriver({
          executeScript: jest
            .fn()
            .mockResolvedValueOnce(undefined)
            .mockResolvedValueOnce(
              makeReadResult({
                fcp: 200,
                fcpRating: 'good',
                lcp: 1800,
                lcpRating: 'good',
              }),
            ),
        }),
      );

      expect(result.fcp).toBe(200);
      expect(result.lcp).toBe(1800);
    });

    it('returns LCP from Element Timing when real LCP is unavailable', async () => {
      const result = await collectWebVitals(
        createMockDriver({
          executeScript: jest
            .fn()
            .mockResolvedValueOnce(undefined)
            .mockResolvedValueOnce(
              makeReadResult({
                fcp: 250,
                fcpRating: 'good',
                lcp: 1200,
                lcpRating: 'good',
              }),
            ),
        }),
      );

      expect(result.fcp).toBe(250);
      expect(result.lcp).toBe(1200);
      expect(result.lcpRating).toBe('good');
    });
  });

  describe('zero-fallbacks', () => {
    it('INP falls back to 0 when Event Timing API has no entries', async () => {
      const result = await collectWebVitals(
        createMockDriver({
          executeScript: jest
            .fn()
            .mockResolvedValueOnce(undefined)
            .mockResolvedValueOnce(
              makeReadResult({ inp: 0, inpRating: 'good' }),
            ),
        }),
      );

      expect(result.inp).toBe(0);
      expect(result.inpRating).toBe('good');
    });

    it('CLS falls back to 0 when layout-shift observer is unsupported', async () => {
      const result = await collectWebVitals(
        createMockDriver({
          executeScript: jest
            .fn()
            .mockResolvedValueOnce(undefined)
            .mockResolvedValueOnce(
              makeReadResult({ cls: 0, clsRating: 'good' }),
            ),
        }),
      );

      expect(result.cls).toBe(0);
      expect(result.clsRating).toBe('good');
    });

    it('read script contains INP = 0 fallback', async () => {
      const execScript = jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(nullMetrics);

      const driver = createMockDriver({ executeScript: execScript });
      await collectWebVitals(driver);

      const readScript = execScript.mock.calls[1][0] as string;
      expect(readScript).toContain('result.inp === null');
      expect(readScript).toContain('result.inp = 0');
    });

    it('read script contains CLS = 0 fallback', async () => {
      const execScript = jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(nullMetrics);

      const driver = createMockDriver({ executeScript: execScript });
      await collectWebVitals(driver);

      const readScript = execScript.mock.calls[1][0] as string;
      expect(readScript).toContain('result.cls === null');
      expect(readScript).toContain('result.cls = 0');
    });
  });

  describe('busy-wait keydown handler', () => {
    it('setup script registers a busy-wait keydown handler', async () => {
      const execScript = jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(nullMetrics);

      const driver = createMockDriver({ executeScript: execScript });
      await collectWebVitals(driver);

      const setupScript = execScript.mock.calls[0][0] as string;
      expect(setupScript).toContain('busyWait');
      expect(setupScript).toContain('keydown');
      expect(setupScript).toContain('performance.now()');
      expect(setupScript).toContain('once: true');
    });

    it('busy-wait targets 16ms duration', async () => {
      const execScript = jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(nullMetrics);

      const driver = createMockDriver({ executeScript: execScript });
      await collectWebVitals(driver);

      const setupScript = execScript.mock.calls[0][0] as string;
      expect(setupScript).toContain('+ 16');
    });
  });

  describe('maxDur > 0 guard removed', () => {
    it('read script does not gate INP on maxDur > 0', async () => {
      const execScript = jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(nullMetrics);

      const driver = createMockDriver({ executeScript: execScript });
      await collectWebVitals(driver);

      const readScript = execScript.mock.calls[1][0] as string;
      expect(readScript).not.toContain('if (maxDur > 0)');
    });

    it('INP is set even when all event durations are 0', async () => {
      const result = await collectWebVitals(
        createMockDriver({
          executeScript: jest
            .fn()
            .mockResolvedValueOnce(undefined)
            .mockResolvedValueOnce(
              makeReadResult({ inp: 0, inpRating: 'good' }),
            ),
        }),
      );

      expect(result.inp).toBe(0);
      expect(result.inp).not.toBeNull();
      expect(result.inpRating).toBe('good');
    });
  });

  describe('metric output', () => {
    function makeDriver(readResult: WebVitalsMetrics) {
      return createMockDriver({
        executeScript: jest
          .fn()
          .mockResolvedValueOnce(undefined)
          .mockResolvedValueOnce(readResult),
      });
    }

    it('returns all metrics non-null with correct ratings', async () => {
      const result = await collectWebVitals(makeDriver(fullMetrics));

      expect(result.inp).toBe(120);
      expect(result.fcp).toBe(280);
      expect(result.lcp).toBeNull();
      expect(result.cls).toBe(0.05);
      expect(result.inpRating).toBe('good');
      expect(result.fcpRating).toBe('good');
      expect(result.clsRating).toBe('good');
    });

    it('returns CLS of exactly 0 as non-null', async () => {
      const result = await collectWebVitals(
        makeDriver(
          makeReadResult({
            inp: 50,
            fcp: 300,
            cls: 0,
            inpRating: 'good',
            fcpRating: 'good',
            clsRating: 'good',
          }),
        ),
      );

      expect(result.cls).toBe(0);
      expect(result.cls).not.toBeNull();
      expect(result.clsRating).toBe('good');
    });

    describe('INP rating thresholds', () => {
      // @ts-expect-error '.each' is missing from type definitions
      it.each([
        { inp: 200, expected: 'good' },
        { inp: 201, expected: 'needs-improvement' },
        { inp: 500, expected: 'needs-improvement' },
        { inp: 501, expected: 'poor' },
      ])(
        'INP $inp ms → $expected',
        async ({ inp, expected }: { inp: number; expected: string }) => {
          const result = await collectWebVitals(
            makeDriver(
              makeReadResult({
                inp,
                inpRating: expected as WebVitalsMetrics['inpRating'],
              }),
            ),
          );
          expect(result.inp).toBe(inp);
          expect(result.inpRating).toBe(expected);
        },
      );
    });

    describe('FCP rating thresholds', () => {
      // @ts-expect-error '.each' is missing from type definitions
      it.each([
        { fcp: 1800, expected: 'good' },
        { fcp: 1801, expected: 'needs-improvement' },
        { fcp: 3000, expected: 'needs-improvement' },
        { fcp: 3001, expected: 'poor' },
      ])(
        'FCP $fcp ms → $expected',
        async ({ fcp, expected }: { fcp: number; expected: string }) => {
          const result = await collectWebVitals(
            makeDriver(
              makeReadResult({
                fcp,
                fcpRating: expected as WebVitalsMetrics['fcpRating'],
              }),
            ),
          );
          expect(result.fcp).toBe(fcp);
          expect(result.fcpRating).toBe(expected);
        },
      );
    });

    describe('CLS rating thresholds', () => {
      // @ts-expect-error '.each' is missing from type definitions
      it.each([
        { cls: 0.1, expected: 'good' },
        { cls: 0.11, expected: 'needs-improvement' },
        { cls: 0.25, expected: 'needs-improvement' },
        { cls: 0.26, expected: 'poor' },
      ])(
        'CLS $cls → $expected',
        async ({ cls, expected }: { cls: number; expected: string }) => {
          const result = await collectWebVitals(
            makeDriver(
              makeReadResult({
                cls,
                clsRating: expected as WebVitalsMetrics['clsRating'],
              }),
            ),
          );
          expect(result.cls).toBe(cls);
          expect(result.clsRating).toBe(expected);
        },
      );
    });

    describe('partial non-null combinations', () => {
      it('INP + FCP non-null, LCP + CLS null', async () => {
        const result = await collectWebVitals(
          makeDriver(
            makeReadResult({
              inp: 16,
              fcp: 300,
              inpRating: 'good',
              fcpRating: 'good',
            }),
          ),
        );

        expect(result.inp).toBe(16);
        expect(result.fcp).toBe(300);
        expect(result.lcp).toBeNull();
        expect(result.cls).toBeNull();
      });

      it('INP + CLS non-null, FCP + LCP null', async () => {
        const result = await collectWebVitals(
          makeDriver(
            makeReadResult({
              inp: 250,
              cls: 0.05,
              inpRating: 'needs-improvement',
              clsRating: 'good',
            }),
          ),
        );

        expect(result.inp).toBe(250);
        expect(result.fcp).toBeNull();
        expect(result.lcp).toBeNull();
        expect(result.cls).toBe(0.05);
      });

      it('only INP non-null', async () => {
        const result = await collectWebVitals(
          makeDriver(makeReadResult({ inp: 600, inpRating: 'poor' })),
        );

        expect(result.inp).toBe(600);
        expect(result.inpRating).toBe('poor');
        expect(result.fcp).toBeNull();
        expect(result.lcp).toBeNull();
        expect(result.cls).toBeNull();
      });
    });
  });
});
