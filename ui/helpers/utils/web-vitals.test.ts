// Mock web-vitals UMD build (same path as in web-vitals.ts)
import {
  onINP,
  onLCP,
  onCLS,
} from 'web-vitals/dist/web-vitals.attribution.umd.cjs';
import {
  initINPObserver,
  initLCPObserver,
  initCLSObserver,
  initWebVitals,
  getWebVitalsMetrics,
  resetWebVitalsMetrics,
} from './web-vitals';

jest.mock('web-vitals/dist/web-vitals.attribution.umd.cjs', () => ({
  onINP: jest.fn(),
  onLCP: jest.fn(),
  onCLS: jest.fn(),
}));

const mockOnINP = onINP as jest.Mock;
const mockOnLCP = onLCP as jest.Mock;
const mockOnCLS = onCLS as jest.Mock;

describe('web-vitals', () => {
  const originalSentry = globalThis.sentry;

  beforeEach(() => {
    jest.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).sentry;
    // Reset metrics before each test
    resetWebVitalsMetrics();
  });

  afterEach(() => {
    globalThis.sentry = originalSentry;
  });

  describe('initINPObserver', () => {
    it('registers INP callback', () => {
      initINPObserver();
      expect(mockOnINP).toHaveBeenCalledTimes(1);
      expect(typeof mockOnINP.mock.calls[0][0]).toBe('function');
    });

    it('reports good INP to Sentry', () => {
      const mockSentry = {
        setMeasurement: jest.fn(),
        setTag: jest.fn(),
        setContext: jest.fn(),
        addBreadcrumb: jest.fn(),
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).sentry = mockSentry;

      initINPObserver();
      const callback = mockOnINP.mock.calls[0][0];

      // Simulate good INP (< 200ms)
      callback({
        value: 150,
        attribution: {
          interactionTarget: 'button.submit',
          interactionType: 'pointer',
          loadState: 'complete',
          inputDelay: 10,
          processingDuration: 100,
          presentationDelay: 40,
        },
      });

      expect(mockSentry.setMeasurement).toHaveBeenCalledWith(
        'benchmark.inp',
        150,
        'millisecond',
      );
      expect(mockSentry.setTag).toHaveBeenCalledWith('inp.rating', 'good');
      expect(mockSentry.setContext).toHaveBeenCalledWith(
        'inp_attribution',
        expect.objectContaining({
          interactionTarget: 'button.submit',
          interactionType: 'pointer',
        }),
      );
      // Good metrics should not add breadcrumb
      expect(mockSentry.addBreadcrumb).not.toHaveBeenCalled();
    });

    it('reports poor INP with warning breadcrumb', () => {
      const mockSentry = {
        setMeasurement: jest.fn(),
        setTag: jest.fn(),
        setContext: jest.fn(),
        addBreadcrumb: jest.fn(),
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).sentry = mockSentry;

      initINPObserver();
      const callback = mockOnINP.mock.calls[0][0];

      // Simulate poor INP (> 500ms)
      callback({
        value: 600,
        attribution: {
          interactionTarget: 'div.slow-element',
          interactionType: 'pointer',
        },
      });

      expect(mockSentry.setTag).toHaveBeenCalledWith('inp.rating', 'poor');
      expect(mockSentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'performance.inp',
          level: 'warning',
        }),
      );
    });

    it('handles missing Sentry gracefully', () => {
      // Sentry not available
      initINPObserver();
      const callback = mockOnINP.mock.calls[0][0];

      // Should not throw
      expect(() => callback({ value: 100, attribution: {} })).not.toThrow();
    });
  });

  describe('initLCPObserver', () => {
    it('registers LCP callback', () => {
      initLCPObserver();
      expect(mockOnLCP).toHaveBeenCalledTimes(1);
    });

    it('reports LCP to Sentry with attribution', () => {
      const mockSentry = {
        setMeasurement: jest.fn(),
        setTag: jest.fn(),
        setContext: jest.fn(),
        addBreadcrumb: jest.fn(),
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).sentry = mockSentry;

      initLCPObserver();
      const callback = mockOnLCP.mock.calls[0][0];

      // Simulate good LCP (< 2500ms)
      callback({
        value: 2000,
        attribution: {
          element: 'div.account-list',
          url: 'https://metamask.io',
        },
      });

      expect(mockSentry.setMeasurement).toHaveBeenCalledWith(
        'benchmark.lcp',
        2000,
        'millisecond',
      );
      expect(mockSentry.setTag).toHaveBeenCalledWith('lcp.rating', 'good');
      expect(mockSentry.setContext).toHaveBeenCalledWith(
        'lcp_attribution',
        expect.objectContaining({
          element: 'div.account-list',
        }),
      );
    });

    it('reports poor LCP correctly', () => {
      const mockSentry = {
        setMeasurement: jest.fn(),
        setTag: jest.fn(),
        setContext: jest.fn(),
        addBreadcrumb: jest.fn(),
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).sentry = mockSentry;

      initLCPObserver();
      const callback = mockOnLCP.mock.calls[0][0];

      // Simulate poor LCP (> 4000ms)
      callback({ value: 5000, attribution: {} });

      expect(mockSentry.setTag).toHaveBeenCalledWith('lcp.rating', 'poor');
    });
  });

  describe('initCLSObserver', () => {
    it('registers CLS callback', () => {
      initCLSObserver();
      expect(mockOnCLS).toHaveBeenCalledTimes(1);
    });

    it('reports CLS to Sentry with unitless measurement', () => {
      const mockSentry = {
        setMeasurement: jest.fn(),
        setTag: jest.fn(),
        setContext: jest.fn(),
        addBreadcrumb: jest.fn(),
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).sentry = mockSentry;

      initCLSObserver();
      const callback = mockOnCLS.mock.calls[0][0];

      // Simulate good CLS (< 0.1)
      callback({
        value: 0.05,
        attribution: {
          largestShiftTarget: 'div.token-list',
          largestShiftTime: 1000,
          largestShiftValue: 0.05,
        },
      });

      expect(mockSentry.setMeasurement).toHaveBeenCalledWith(
        'benchmark.cls',
        0.05,
        'none', // CLS is unitless
      );
      expect(mockSentry.setTag).toHaveBeenCalledWith('cls.rating', 'good');
    });

    it('reports poor CLS correctly', () => {
      const mockSentry = {
        setMeasurement: jest.fn(),
        setTag: jest.fn(),
        setContext: jest.fn(),
        addBreadcrumb: jest.fn(),
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).sentry = mockSentry;

      initCLSObserver();
      const callback = mockOnCLS.mock.calls[0][0];

      // Simulate poor CLS (> 0.25)
      callback({ value: 0.3, attribution: {} });

      expect(mockSentry.setTag).toHaveBeenCalledWith('cls.rating', 'poor');
    });
  });

  describe('initWebVitals', () => {
    it('initializes all observers', () => {
      initWebVitals();

      expect(mockOnINP).toHaveBeenCalledTimes(1);
      expect(mockOnLCP).toHaveBeenCalledTimes(1);
      expect(mockOnCLS).toHaveBeenCalledTimes(1);
    });
  });

  describe('getWebVitalsMetrics', () => {
    it('returns initial null values', () => {
      const metrics = getWebVitalsMetrics();

      expect(metrics).toEqual({
        inp: null,
        lcp: null,
        cls: null,
        inpRating: null,
        lcpRating: null,
        clsRating: null,
      });
    });

    it('returns stored INP value after callback fires', () => {
      initINPObserver();
      const callback = mockOnINP.mock.calls[0][0];

      callback({ value: 150, attribution: {} });

      const metrics = getWebVitalsMetrics();
      expect(metrics.inp).toBe(150);
      expect(metrics.inpRating).toBe('good');
    });

    it('returns stored LCP value after callback fires', () => {
      initLCPObserver();
      const callback = mockOnLCP.mock.calls[0][0];

      callback({ value: 2000, attribution: {} });

      const metrics = getWebVitalsMetrics();
      expect(metrics.lcp).toBe(2000);
      expect(metrics.lcpRating).toBe('good');
    });

    it('returns stored CLS value after callback fires', () => {
      initCLSObserver();
      const callback = mockOnCLS.mock.calls[0][0];

      callback({ value: 0.05, attribution: {} });

      const metrics = getWebVitalsMetrics();
      expect(metrics.cls).toBe(0.05);
      expect(metrics.clsRating).toBe('good');
    });

    it('returns copy of metrics to prevent mutation', () => {
      initINPObserver();
      const callback = mockOnINP.mock.calls[0][0];
      callback({ value: 150, attribution: {} });

      const metrics1 = getWebVitalsMetrics();
      metrics1.inp = 999;

      const metrics2 = getWebVitalsMetrics();
      expect(metrics2.inp).toBe(150);
    });
  });

  describe('resetWebVitalsMetrics', () => {
    it('resets all metrics to null', () => {
      // First populate metrics
      initINPObserver();
      initLCPObserver();
      initCLSObserver();

      const inpCallback = mockOnINP.mock.calls[0][0];
      const lcpCallback = mockOnLCP.mock.calls[0][0];
      const clsCallback = mockOnCLS.mock.calls[0][0];

      inpCallback({ value: 150, attribution: {} });
      lcpCallback({ value: 2000, attribution: {} });
      clsCallback({ value: 0.05, attribution: {} });

      // Verify metrics are populated
      let metrics = getWebVitalsMetrics();
      expect(metrics.inp).toBe(150);
      expect(metrics.lcp).toBe(2000);
      expect(metrics.cls).toBe(0.05);

      // Reset and verify
      resetWebVitalsMetrics();

      metrics = getWebVitalsMetrics();
      expect(metrics).toEqual({
        inp: null,
        lcp: null,
        cls: null,
        inpRating: null,
        lcpRating: null,
        clsRating: null,
      });
    });
  });

  describe('metrics storage with ratings', () => {
    it('stores needs-improvement INP rating', () => {
      initINPObserver();
      const callback = mockOnINP.mock.calls[0][0];

      callback({ value: 300, attribution: {} }); // 200-500ms is needs-improvement

      const metrics = getWebVitalsMetrics();
      expect(metrics.inp).toBe(300);
      expect(metrics.inpRating).toBe('needs-improvement');
    });

    it('stores poor LCP rating', () => {
      initLCPObserver();
      const callback = mockOnLCP.mock.calls[0][0];

      callback({ value: 5000, attribution: {} }); // > 4000ms is poor

      const metrics = getWebVitalsMetrics();
      expect(metrics.lcp).toBe(5000);
      expect(metrics.lcpRating).toBe('poor');
    });

    it('stores needs-improvement CLS rating', () => {
      initCLSObserver();
      const callback = mockOnCLS.mock.calls[0][0];

      callback({ value: 0.15, attribution: {} }); // 0.1-0.25 is needs-improvement

      const metrics = getWebVitalsMetrics();
      expect(metrics.cls).toBe(0.15);
      expect(metrics.clsRating).toBe('needs-improvement');
    });
  });
});
