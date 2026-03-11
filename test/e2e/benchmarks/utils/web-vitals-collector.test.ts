import type { Driver } from '../../webdriver/driver';
import type { WebVitalsMetrics } from './types';
import { collectWebVitals } from './web-vitals-collector';

function createMockDriver(overrides: {
  executeScript?: jest.Mock;
  delay?: jest.Mock;
  innerActions?: jest.Mock | null;
  innerSendDevToolsCommand?: jest.Mock | null;
}): Driver {
  const innerDriver: Record<string, unknown> = {};

  if (overrides.innerActions !== null) {
    const perform =
      overrides.innerActions ?? jest.fn().mockResolvedValue(undefined);
    innerDriver.actions = jest.fn().mockReturnValue({
      move: jest.fn().mockReturnThis(),
      click: jest.fn().mockReturnThis(),
      perform,
    });
  }

  if (overrides.innerSendDevToolsCommand !== null) {
    innerDriver.sendDevToolsCommand =
      overrides.innerSendDevToolsCommand ??
      jest.fn().mockResolvedValue(undefined);
  }

  const driver = {
    executeScript: overrides.executeScript ?? jest.fn().mockResolvedValue(null),
    delay: overrides.delay ?? jest.fn().mockResolvedValue(undefined),
    driver:
      overrides.innerActions === null &&
      overrides.innerSendDevToolsCommand === null
        ? undefined
        : innerDriver,
  } as unknown as Driver;
  return driver;
}

const fullMetrics: WebVitalsMetrics = {
  inp: 120,
  fcp: 280,
  lcp: 1800,
  cls: 0.05,
  inpRating: 'good',
  fcpRating: 'good',
  lcpRating: 'good',
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
  beforeEach(() => {
    jest.spyOn(console, 'info').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

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

    it('calls delay(200) between probe and read', async () => {
      const delay = jest.fn().mockResolvedValue(undefined);
      const callOrder: string[] = [];

      const perform = jest.fn().mockImplementation(async () => {
        callOrder.push('actions');
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
        innerActions: perform,
      });

      await collectWebVitals(driver);

      expect(delay).toHaveBeenCalledWith(500);
      expect(callOrder).toEqual(['setup', 'actions', 'delay', 'read']);
    });
  });

  describe('INP probe (Selenium Actions → CDP fallback)', () => {
    it('uses Selenium Actions API as primary probe', async () => {
      const perform = jest.fn().mockResolvedValue(undefined);
      const sendCmd = jest.fn().mockResolvedValue(undefined);
      const execScript = jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(fullMetrics);

      const driver = createMockDriver({
        executeScript: execScript,
        innerActions: perform,
        innerSendDevToolsCommand: sendCmd,
      });

      await collectWebVitals(driver);

      expect(perform).toHaveBeenCalledTimes(1);
      expect(sendCmd).not.toHaveBeenCalled();
    });

    it('falls back to CDP when Actions throws', async () => {
      const perform = jest.fn().mockRejectedValue(new Error('Actions failed'));
      const sendCmd = jest.fn().mockResolvedValue(undefined);
      const execScript = jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(fullMetrics);

      const driver = createMockDriver({
        executeScript: execScript,
        innerActions: perform,
        innerSendDevToolsCommand: sendCmd,
      });

      await collectWebVitals(driver);

      expect(perform).toHaveBeenCalledTimes(1);
      expect(sendCmd).toHaveBeenCalledTimes(2);
      expect(sendCmd).toHaveBeenCalledWith(
        'Input.dispatchMouseEvent',
        expect.objectContaining({ type: 'mousePressed', button: 'left' }),
      );
      expect(sendCmd).toHaveBeenCalledWith(
        'Input.dispatchMouseEvent',
        expect.objectContaining({ type: 'mouseReleased', button: 'left' }),
      );
    });

    it('uses CDP when Actions API is unavailable', async () => {
      const sendCmd = jest.fn().mockResolvedValue(undefined);
      const execScript = jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(fullMetrics);

      const driver = {
        executeScript: execScript,
        delay: jest.fn().mockResolvedValue(undefined),
        driver: { sendDevToolsCommand: sendCmd },
      } as unknown as Driver;

      await collectWebVitals(driver);

      expect(sendCmd).toHaveBeenCalledTimes(2);
    });
  });

  describe('graceful degradation', () => {
    it('returns metrics when both Actions and CDP throw', async () => {
      const perform = jest.fn().mockRejectedValue(new Error('Actions gone'));
      const sendCmd = jest.fn().mockRejectedValue(new Error('CDP gone'));
      const execScript = jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(fullMetrics);

      const driver = createMockDriver({
        executeScript: execScript,
        innerActions: perform,
        innerSendDevToolsCommand: sendCmd,
      });

      const result = await collectWebVitals(driver);
      expect(result).toEqual(fullMetrics);
    });

    it('works when inner driver is undefined', async () => {
      const execScript = jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(fullMetrics);

      const driver = createMockDriver({
        executeScript: execScript,
        innerActions: null,
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
        .mockResolvedValueOnce(makeReadResult());

      const driver = createMockDriver({ executeScript: execScript });
      await collectWebVitals(driver);

      const setupScript = execScript.mock.calls[0][0] as string;
      expect(setupScript).toContain('PerformanceObserver');
      expect(setupScript).toContain("type: 'event'");
      expect(setupScript).toContain("type: 'largest-contentful-paint'");
      expect(setupScript).toContain("type: 'layout-shift'");
      expect(setupScript).toContain('buffered: true');
      expect(setupScript).toContain('first-contentful-paint');
      expect(setupScript).toContain('__cwv');
    });

    it('setup script tracks eventObserverSupported and probeReceived', async () => {
      const execScript = jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(makeReadResult());

      const driver = createMockDriver({ executeScript: execScript });
      await collectWebVitals(driver);

      const setupScript = execScript.mock.calls[0][0] as string;
      expect(setupScript).toContain('eventObserverSupported');
      expect(setupScript).toContain('probeReceived');
    });

    it('read script computes metrics and cleans up', async () => {
      const execScript = jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(makeReadResult());

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
        .mockResolvedValueOnce(makeReadResult());

      const driver = createMockDriver({ executeScript: execScript });
      await collectWebVitals(driver);

      const readScript = execScript.mock.calls[1][0] as string;
      expect(readScript).toContain('result.fcp = cwv.fcp');
      expect(readScript).toContain('result.fcpRating');
    });

    it('read script does not substitute FCP for LCP', async () => {
      const execScript = jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(makeReadResult());

      const driver = createMockDriver({ executeScript: execScript });
      await collectWebVitals(driver);

      const readScript = execScript.mock.calls[1][0] as string;
      expect(readScript).not.toContain('result.lcp = result.fcp');
    });

    it('read script uses mm-hero-painted mark as LCP fallback', async () => {
      const execScript = jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(makeReadResult());

      const driver = createMockDriver({ executeScript: execScript });
      await collectWebVitals(driver);

      const readScript = execScript.mock.calls[1][0] as string;
      expect(readScript).toContain('mm-hero-painted');
      expect(readScript).toContain("getEntriesByName('mm-hero-painted'");
    });

    it('read script checks stateHooks for INP, LCP, and CLS', async () => {
      const execScript = jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(makeReadResult());

      const driver = createMockDriver({ executeScript: execScript });
      await collectWebVitals(driver);

      const readScript = execScript.mock.calls[1][0] as string;
      expect(readScript).toContain('stateHooks');
      expect(readScript).toContain('getWebVitalsMetrics');
      expect(readScript).toContain('resetWebVitalsMetrics');
      expect(readScript).toContain('m.inp');
    });

    it('read script includes diagnostic fields', async () => {
      const execScript = jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(makeReadResult());

      const driver = createMockDriver({ executeScript: execScript });
      await collectWebVitals(driver);

      const readScript = execScript.mock.calls[1][0] as string;
      expect(readScript).toContain('cwvDiagnostic');
      expect(readScript).toContain('supportedEntryTypes');
      expect(readScript).toContain('eventEntryCount');
      expect(readScript).toContain('eventObserverSupported');
      expect(readScript).toContain('clsSupported');
      expect(readScript).toContain('clsEntryCount');
      expect(readScript).toContain('probeReceived');
      expect(readScript).toContain('stateHooksInp');
      expect(readScript).toContain('stateHooksAvailable');
    });
  });

  describe('diagnostic stripping', () => {
    it('strips cwvDiagnostic from returned metrics', async () => {
      const metricsWithDiag = {
        ...fullMetrics,
        cwvDiagnostic: {
          supportedEntryTypes: ['event', 'layout-shift'],
          eventEntryCount: 3,
          eventObserverSupported: true,
          clsSupported: true,
          clsEntryCount: 0,
          probeReceived: true,
          stateHooksInp: 120,
          stateHooksAvailable: true,
        },
      };

      const driver = createMockDriver({
        executeScript: jest
          .fn()
          .mockResolvedValueOnce(undefined)
          .mockResolvedValueOnce(metricsWithDiag),
      });

      const result = await collectWebVitals(driver);
      expect(result).not.toHaveProperty('cwvDiagnostic');
      expect(result.inp).toBe(120);
    });

    it('logs diagnostic info via console.info', async () => {
      const diagnostic = {
        supportedEntryTypes: [],
        eventEntryCount: 0,
        eventObserverSupported: false,
        clsSupported: false,
        clsEntryCount: 0,
        probeReceived: false,
        stateHooksInp: null,
        stateHooksAvailable: true,
      };

      const driver = createMockDriver({
        executeScript: jest
          .fn()
          .mockResolvedValueOnce(undefined)
          .mockResolvedValueOnce({
            ...makeReadResult(),
            cwvDiagnostic: diagnostic,
          }),
      });

      await collectWebVitals(driver);
      expect(console.info).toHaveBeenCalledWith(
        '[web-vitals-collector] diagnostic:',
        diagnostic,
      );
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

    it('returns LCP from mm-hero-painted fallback', async () => {
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
    it('INP stays null when no entries and no stateHooks', async () => {
      const result = await collectWebVitals(
        createMockDriver({
          executeScript: jest
            .fn()
            .mockResolvedValueOnce(undefined)
            .mockResolvedValueOnce(makeReadResult()),
        }),
      );

      expect(result.inp).toBeNull();
      expect(result.inpRating).toBeNull();
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

    it('read script does NOT contain INP = 0 fallback', async () => {
      const execScript = jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(makeReadResult());

      const driver = createMockDriver({ executeScript: execScript });
      await collectWebVitals(driver);

      const readScript = execScript.mock.calls[1][0] as string;
      expect(readScript).not.toContain('result.inp = 0');
    });

    it('read script contains CLS = 0 fallback', async () => {
      const execScript = jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(makeReadResult());

      const driver = createMockDriver({ executeScript: execScript });
      await collectWebVitals(driver);

      const readScript = execScript.mock.calls[1][0] as string;
      expect(readScript).toContain('result.cls === null');
      expect(readScript).toContain('result.cls = 0');
    });
  });

  describe('busy-wait pointerdown handler', () => {
    it('setup script registers a busy-wait pointerdown handler', async () => {
      const execScript = jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(makeReadResult());

      const driver = createMockDriver({ executeScript: execScript });
      await collectWebVitals(driver);

      const setupScript = execScript.mock.calls[0][0] as string;
      expect(setupScript).toContain('busyWait');
      expect(setupScript).toContain('pointerdown');
      expect(setupScript).toContain('performance.now()');
      expect(setupScript).toContain('once: true');
    });

    it('busy-wait targets 16ms duration', async () => {
      const execScript = jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(makeReadResult());

      const driver = createMockDriver({ executeScript: execScript });
      await collectWebVitals(driver);

      const setupScript = execScript.mock.calls[0][0] as string;
      expect(setupScript).toContain('+ 16');
    });
  });

  describe('maxDur > 0 guard', () => {
    it('read script gates INP fallback on maxDur > 0 when stateHooks unavailable', async () => {
      const execScript = jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(makeReadResult());

      const driver = createMockDriver({ executeScript: execScript });
      await collectWebVitals(driver);

      const readScript = execScript.mock.calls[1][0] as string;
      expect(readScript).toContain('if (maxDur > 0)');
    });

    it('INP is set when event durations are reported', async () => {
      const result = await collectWebVitals(
        createMockDriver({
          executeScript: jest
            .fn()
            .mockResolvedValueOnce(undefined)
            .mockResolvedValueOnce(
              makeReadResult({ inp: 16, inpRating: 'good' }),
            ),
        }),
      );

      expect(result.inp).toBe(16);
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
      expect(result.lcp).toBe(1800);
      expect(result.cls).toBe(0.05);
      expect(result.inpRating).toBe('good');
      expect(result.fcpRating).toBe('good');
      expect(result.lcpRating).toBe('good');
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
