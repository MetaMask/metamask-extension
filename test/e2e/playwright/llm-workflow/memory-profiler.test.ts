import type { SessionLaunchResult } from '@metamask/client-mcp-core';
import {
  calculateDeltas,
  createMemoryReport,
  navigateExtensionRoute,
  parseByteSize,
  parseMemoryProfilerArgs,
  type MemorySample,
} from './memory-profiler';

const baselineSample: MemorySample = {
  label: 'baseline',
  timestamp: '2026-05-15T00:00:00.000Z',
  url: 'chrome-extension://extension-id/home.html#/',
  runtimeHeap: {
    usedSize: 100,
    totalSize: 200,
  },
  performance: {
    JSHeapUsedSize: 50,
    JSHeapTotalSize: 75,
  },
  domCounters: {
    documents: 1,
    nodes: 10,
    jsEventListeners: 5,
  },
  liveDomElementCount: 7,
};

const finalSample: MemorySample = {
  label: 'iteration-1',
  timestamp: '2026-05-15T00:01:00.000Z',
  url: 'chrome-extension://extension-id/home.html#/',
  runtimeHeap: {
    usedSize: 120,
    totalSize: 260,
  },
  performance: {
    JSHeapUsedSize: 90,
    JSHeapTotalSize: 150,
  },
  domCounters: {
    documents: 2,
    nodes: 18,
    jsEventListeners: 9,
  },
  liveDomElementCount: 11,
};

describe('memory-profiler', () => {
  describe('parseMemoryProfilerArgs', () => {
    it('uses useful defaults for route leak profiling', () => {
      const options = parseMemoryProfilerArgs([]);

      expect(options.iterations).toBe(5);
      expect(options.flow).toBe('route-cycle');
      expect(options.stateMode).toBe('default');
      expect(options.sampleMode).toBe('each');
      expect(options.probeMode).toBe('full');
      expect(options.unlock).toBe(true);
      expect(options.collectGarbage).toBe(true);
      expect(options.outputPath).toMatch(
        /test-artifacts\/memory\/memory-profile-\d+\.json/u,
      );
    });

    it('parses explicit profiling options', () => {
      const options = parseMemoryProfilerArgs([
        '--',
        '--iterations',
        '25',
        '--flow',
        'settings-route',
        '--state',
        'custom',
        '--preset',
        'withMultipleAccounts',
        '--snapshot',
        'final',
        '--sample',
        'final',
        '--probe',
        'cdp',
        '--no-unlock',
        '--no-gc',
        '--wait-after-flow',
        '100',
        '--interval',
        '50',
        '--max-used-heap-growth',
        '25MiB',
        '--max-js-heap-growth',
        '5mb',
        '--max-dom-nodes-growth',
        '100',
        '--max-js-event-listeners-growth',
        '20',
        '--output',
        '/tmp/report.json',
      ]);

      expect(options).toStrictEqual(
        expect.objectContaining({
          iterations: 25,
          flow: 'settings-route',
          stateMode: 'custom',
          fixturePreset: 'withMultipleAccounts',
          snapshotMode: 'final',
          sampleMode: 'final',
          probeMode: 'cdp',
          unlock: false,
          collectGarbage: false,
          waitAfterFlowMs: 100,
          intervalMs: 50,
          maxUsedHeapGrowthBytes: 25 * 1024 * 1024,
          maxJsHeapGrowthBytes: 5 * 1000 * 1000,
          maxDomNodesGrowth: 100,
          maxJsEventListenersGrowth: 20,
          outputPath: '/tmp/report.json',
        }),
      );
    });

    it('rejects invalid sample and probe modes', () => {
      expect(() => parseMemoryProfilerArgs(['--sample', 'always'])).toThrow(
        '--sample must be one of: each, final',
      );

      expect(() => parseMemoryProfilerArgs(['--probe', 'dom'])).toThrow(
        '--probe must be one of: full, cdp, heap',
      );
    });

    it('rejects unknown options', () => {
      expect(() => parseMemoryProfilerArgs(['--unknown'])).toThrow(
        'Unknown option: --unknown',
      );
    });

    it('accepts the user-like send open and back flow', () => {
      const options = parseMemoryProfilerArgs([
        '--flow',
        'send-open-back',
      ]);

      expect(options.flow).toBe('send-open-back');
    });
  });

  describe('parseByteSize', () => {
    it('parses byte units', () => {
      expect(parseByteSize('1024')).toBe(1024);
      expect(parseByteSize('1kb')).toBe(1000);
      expect(parseByteSize('1KiB')).toBe(1024);
      expect(parseByteSize('1.5MiB')).toBe(1572864);
    });
  });

  describe('calculateDeltas', () => {
    it('calculates heap and DOM counter deltas', () => {
      expect(calculateDeltas(baselineSample, finalSample)).toStrictEqual({
        runtimeUsedSize: 20,
        runtimeTotalSize: 60,
        jsHeapUsedSize: 40,
        jsHeapTotalSize: 75,
        nodes: 8,
        documents: 1,
        jsEventListeners: 4,
        liveDomElements: 4,
      });
    });
  });

  describe('navigateExtensionRoute', () => {
    it('navigates to an extension hash route', async () => {
      const page = {
        goto: jest.fn().mockResolvedValue(undefined),
        waitForLoadState: jest.fn().mockResolvedValue(undefined),
      };

      await navigateExtensionRoute(
        page as never,
        'extension-id',
        '/send/asset',
      );

      expect(page.goto).toHaveBeenCalledWith(
        'chrome-extension://extension-id/home.html#/send/asset',
      );
      expect(page.waitForLoadState).toHaveBeenCalledWith('domcontentloaded');
    });
  });

  describe('createMemoryReport', () => {
    it('summarizes samples and threshold results without serializing password', () => {
      const options = parseMemoryProfilerArgs([
        '--output',
        '/tmp/report.json',
        '--max-used-heap-growth',
        '25b',
        '--max-js-heap-growth',
        '25b',
        '--max-dom-nodes-growth',
        '10',
        '--max-js-event-listeners-growth',
        '3',
      ]);
      const launchResult = {
        sessionId: 'session-id',
        extensionId: 'extension-id',
        state: {},
      } as unknown as SessionLaunchResult;

      const report = createMemoryReport({
        createdAt: '2026-05-15T00:00:00.000Z',
        launchResult,
        options,
        samples: [baselineSample, finalSample],
        snapshots: [],
      });

      expect(report.summary.deltas.runtimeUsedSize).toBe(20);
      expect(report.summary.deltas.jsHeapUsedSize).toBe(40);
      expect(report.summary.thresholds).toStrictEqual([
        {
          name: 'runtimeUsedSize',
          limit: 25,
          actual: 20,
          unit: 'bytes',
          passed: true,
        },
        {
          name: 'jsHeapUsedSize',
          limit: 25,
          actual: 40,
          unit: 'bytes',
          passed: false,
        },
        {
          name: 'nodes',
          limit: 10,
          actual: 8,
          unit: 'count',
          passed: true,
        },
        {
          name: 'jsEventListeners',
          limit: 3,
          actual: 4,
          unit: 'count',
          passed: false,
        },
      ]);
      expect(report.options).not.toHaveProperty('password');
    });
  });
});
