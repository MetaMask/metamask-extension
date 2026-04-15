import { promises as fs } from 'fs';
import type { BenchmarkResults } from '../../shared/constants/benchmarks';
import { THRESHOLD_SEVERITY } from '../../shared/constants/benchmarks';
import {
  runComparison,
  buildMetricLines,
  loadCurrentBenchmarks,
  printReport,
} from './compare-benchmarks';
import { COMPARISON_SEVERITY } from './comparison-utils';
import type { BenchmarkEntryComparison } from './comparison-utils';
import * as historicalComparison from './historical-comparison';

jest.mock('fs', () => ({
  promises: {
    readdir: jest.fn(),
    readFile: jest.fn(),
  },
}));

function makeBenchmarkResults(
  overrides: Partial<BenchmarkResults> = {},
): BenchmarkResults {
  return {
    testTitle: 'test',
    persona: 'standard',
    mean: { uiStartup: 1500 },
    min: { uiStartup: 1000 },
    max: { uiStartup: 2000 },
    stdDev: { uiStartup: 200 },
    p75: { uiStartup: 1800 },
    p95: { uiStartup: 2200 },
    ...overrides,
  };
}

describe('compare-benchmarks', () => {
  describe('runComparison', () => {
    beforeEach(() => {
      jest.spyOn(console, 'warn').mockImplementation();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('passes when results are within thresholds', () => {
      const benchmarks = [
        {
          name: 'benchmark-chrome-browserify-userJourneyOnboardingImport',
          data: {
            onboardingImportWallet: makeBenchmarkResults({
              p75: { importWalletToSocialScreen: 1500 },
              p95: { importWalletToSocialScreen: 2000 },
              mean: { importWalletToSocialScreen: 1200 },
            }),
          },
        },
      ];

      const result = runComparison(benchmarks, {});
      expect(result.anyFailed).toBe(false);
      expect(result.comparisons.length).toBeGreaterThan(0);
    });

    it('sets source from artifact filename', () => {
      const benchmarks = [
        {
          name: 'benchmark-chrome-browserify-userJourneyOnboardingImport',
          data: {
            onboardingImportWallet: makeBenchmarkResults({
              p75: { importWalletToSocialScreen: 1500 },
              p95: { importWalletToSocialScreen: 2000 },
              mean: { importWalletToSocialScreen: 1200 },
            }),
          },
        },
      ];

      const result = runComparison(benchmarks, {});
      expect(result.comparisons[0].source).toBe('chrome-browserify');
    });

    it('fails when p75 exceeds fail threshold', () => {
      const benchmarks = [
        {
          name: 'benchmark-chrome-browserify-userJourneyOnboardingImport',
          data: {
            onboardingImportWallet: makeBenchmarkResults({
              p75: { importWalletToSocialScreen: 99999 },
              p95: { importWalletToSocialScreen: 99999 },
              mean: { importWalletToSocialScreen: 99999 },
            }),
          },
        },
      ];

      const result = runComparison(benchmarks, {});
      expect(result.anyFailed).toBe(true);
    });

    it('includes relative metrics when baseline is available', () => {
      const benchmarks = [
        {
          name: 'benchmark-chrome-browserify-userJourneyOnboardingImport',
          data: {
            onboardingImportWallet: makeBenchmarkResults({
              p75: { importWalletToSocialScreen: 1500 },
              p95: { importWalletToSocialScreen: 2000 },
              mean: { importWalletToSocialScreen: 1200 },
            }),
          },
        },
      ];

      const baseline = {
        'userJourneyOnboardingImport/onboardingImportWallet': {
          importWalletToSocialScreen: {
            mean: 1100,
            stdDev: 50,
            p75: 1400,
            p95: 1900,
          },
        },
      };

      const result = runComparison(benchmarks, baseline);
      const comparison = result.comparisons[0];
      expect(comparison.relativeMetrics.length).toBeGreaterThan(0);
      const meanMetric = comparison.relativeMetrics.find(
        (m) => m.percentile === 'mean',
      );
      const p75Metric = comparison.relativeMetrics.find(
        (m) => m.percentile === 'p75',
      );
      expect(meanMetric).toBeDefined();
      expect(meanMetric?.baseline).toBe(1100);
      expect(p75Metric).toBeDefined();
      expect(p75Metric?.baseline).toBe(1400);
    });

    it('resolves page-load baseline for startup benchmarks', () => {
      const benchmarks = [
        {
          name: 'benchmark-chrome-browserify-startupStandardHome',
          data: {
            startupStandardHome: makeBenchmarkResults({
              p75: { uiStartup: 1800 },
              p95: { uiStartup: 2200 },
              mean: { uiStartup: 1500 },
            }),
          },
        },
      ];

      const baseline = {
        'pageLoad/startupStandardHome': {
          uiStartup: { mean: 1400, stdDev: 80, p75: 1700, p95: 2100 },
        },
      };

      const result = runComparison(benchmarks, baseline);
      const comparison = result.comparisons[0];
      expect(comparison.relativeMetrics.length).toBeGreaterThan(0);
      expect(
        comparison.relativeMetrics.find((m) => m.percentile === 'mean')
          ?.baseline,
      ).toBe(1400);
      expect(
        comparison.relativeMetrics.find((m) => m.percentile === 'p75')
          ?.baseline,
      ).toBe(1700);
    });

    it('skips entries with no matching threshold config', () => {
      const benchmarks = [
        {
          name: 'unknown-benchmark',
          data: {
            'unknown-benchmark': makeBenchmarkResults(),
          },
        },
      ];

      const result = runComparison(benchmarks, {});
      expect(result.comparisons).toHaveLength(0);
    });
  });
});

describe('loadCurrentBenchmarks', () => {
  const mockReaddir = fs.readdir as jest.Mock;
  const mockReadFile = fs.readFile as jest.Mock;

  afterEach(() => {
    mockReaddir.mockReset();
    mockReadFile.mockReset();
  });

  it('reads all JSON files in the directory and parses them', async () => {
    const payload: Record<string, BenchmarkResults> = {
      standardHome: {
        testTitle: 'standard-home',
        persona: 'standard',
        mean: { uiStartup: 1500 },
        min: { uiStartup: 1000 },
        max: { uiStartup: 2000 },
        stdDev: { uiStartup: 200 },
        p75: { uiStartup: 1800 },
        p95: { uiStartup: 2200 },
      },
    };

    mockReaddir.mockResolvedValue(['benchmark-chrome.json', 'other.txt']);
    mockReadFile.mockResolvedValue(JSON.stringify(payload));

    const results = await loadCurrentBenchmarks('/tmp/benchmarks');

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('benchmark-chrome');
    expect(results[0].data).toStrictEqual(payload);
  });

  it('returns an empty array when no JSON files are present', async () => {
    mockReaddir.mockResolvedValue(['README.md', 'data.txt']);

    const results = await loadCurrentBenchmarks('/tmp/benchmarks');
    expect(results).toHaveLength(0);
  });
});

const makeComparison = (
  overrides: Partial<BenchmarkEntryComparison> = {},
): BenchmarkEntryComparison => ({
  benchmarkName: 'standardHome',
  relativeMetrics: [],
  absoluteViolations: [],
  hasRegression: false,
  hasWarning: false,
  absoluteFailed: false,
  ...overrides,
});

describe('printReport', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('prints PASS result when no comparison failed', () => {
    printReport({ comparisons: [], anyFailed: false });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('PASS — all benchmarks within constant limits'),
    );
  });

  it('prints FAIL result when anyFailed is true', () => {
    printReport({
      comparisons: [
        makeComparison({
          benchmarkName: 'standardHome',
          absoluteFailed: true,
        }),
      ],
      anyFailed: true,
    });

    const allCalls = consoleSpy.mock.calls.flat().join('\n');
    expect(allCalls).toContain('FAIL — at least one benchmark');
    expect(allCalls).toContain('FAIL  standardHome');
  });

  it('shows passing comparison in grouped PASS section', () => {
    printReport({
      comparisons: [
        makeComparison({
          benchmarkName: 'loadNewAccount',
          source: 'chrome-browserify',
          absoluteFailed: false,
        }),
      ],
      anyFailed: false,
    });

    const allCalls = consoleSpy.mock.calls.flat().join('\n');
    expect(allCalls).toContain('1 benchmarks within thresholds');
    expect(allCalls).toContain('loadNewAccount');
    expect(allCalls).toContain('chrome-browserify');
  });

  it('shows failing comparison with source label and FAIL prefix', () => {
    printReport({
      comparisons: [
        makeComparison({
          benchmarkName: 'loadNewAccount',
          source: 'firefox-webpack',
          absoluteFailed: true,
        }),
      ],
      anyFailed: true,
    });

    const allCalls = consoleSpy.mock.calls.flat().join('\n');
    expect(allCalls).toContain('FAIL  loadNewAccount [firefox-webpack]');
  });

  it('groups passing entries without baseline into PASS section', () => {
    printReport({
      comparisons: [
        makeComparison({ relativeMetrics: [], absoluteViolations: [] }),
      ],
      anyFailed: false,
    });

    const allCalls = consoleSpy.mock.calls.flat().join('\n');
    expect(allCalls).toContain('1 benchmarks within thresholds');
  });

  it('shows all-passing metrics in PASS section without detail lines', () => {
    const { COMPARISON_SEVERITY: SEV } = jest.requireActual(
      './comparison-utils',
    ) as typeof import('./comparison-utils');
    printReport({
      comparisons: [
        makeComparison({
          benchmarkName: 'standardHome',
          source: 'chrome-browserify',
          relativeMetrics: [
            {
              metric: 'uiStartup',
              percentile: 'p95',
              current: 1400,
              baseline: 1400,
              delta: 0,
              deltaPercent: 0,
              severity: SEV.Pass.value,
              indication: SEV.Pass.icon,
            },
          ],
        }),
      ],
      anyFailed: false,
    });

    const allCalls = consoleSpy.mock.calls.flat().join('\n');
    expect(allCalls).toContain('1 benchmarks within thresholds');
    expect(allCalls).toContain('standardHome: chrome-browserify');
    expect(allCalls).not.toContain('[Show logs]');
  });

  it('prints issue metric lines for comparisons with violations', () => {
    const { COMPARISON_SEVERITY: SEV } = jest.requireActual(
      './comparison-utils',
    ) as typeof import('./comparison-utils');
    const { THRESHOLD_SEVERITY: TS } = jest.requireActual(
      '../../shared/constants/benchmarks',
    ) as typeof import('../../shared/constants/benchmarks');
    printReport({
      comparisons: [
        makeComparison({
          benchmarkName: 'standardHome',
          source: 'chrome-browserify',
          absoluteFailed: true,
          absoluteViolations: [
            {
              metricId: 'uiStartup',
              percentile: 'p95',
              value: 6000,
              threshold: 4800,
              severity: TS.Fail,
            },
          ],
        }),
      ],
      anyFailed: true,
    });

    const allCalls = consoleSpy.mock.calls.flat().join('\n');
    expect(allCalls).toContain('FAIL  standardHome [chrome-browserify]');
    expect(allCalls).toContain('uiStartup');
    expect(allCalls).toContain(SEV.Regression.icon);
  });

  it('reports correct total counts for failed and warned comparisons', () => {
    const { THRESHOLD_SEVERITY: TS } = jest.requireActual(
      '../../shared/constants/benchmarks',
    ) as typeof import('../../shared/constants/benchmarks');
    printReport({
      comparisons: [
        makeComparison({ benchmarkName: 'A', absoluteFailed: true }),
        makeComparison({
          benchmarkName: 'B',
          absoluteFailed: false,
          absoluteViolations: [
            {
              metricId: 'uiStartup',
              percentile: 'p75',
              value: 2100,
              threshold: 2000,
              severity: TS.Warn,
            },
          ],
        }),
        makeComparison({ benchmarkName: 'C', absoluteFailed: false }),
      ],
      anyFailed: true,
    });

    const allCalls = consoleSpy.mock.calls.flat().join('\n');
    expect(allCalls).toContain('3 benchmarks');
    expect(allCalls).toContain('1 failed');
    expect(allCalls).toContain('1 warnings');
  });

  it('groups multiple sources for the same benchmark name in PASS section', () => {
    printReport({
      comparisons: [
        makeComparison({
          benchmarkName: 'startupStandardHome',
          source: 'chrome-browserify',
        }),
        makeComparison({
          benchmarkName: 'startupStandardHome',
          source: 'firefox-browserify',
        }),
      ],
      anyFailed: false,
    });

    const allCalls = consoleSpy.mock.calls.flat().join('\n');
    expect(allCalls).toContain('2 benchmarks within thresholds');
    expect(allCalls).toContain(
      'startupStandardHome: chrome-browserify, firefox-browserify',
    );
  });
});

describe('buildMetricLines', () => {
  it('returns empty array when comparison has no metrics or violations', () => {
    expect(buildMetricLines(makeComparison())).toHaveLength(0);
  });

  it('formats a metric with baseline using relative delta and warn icon when has issue', () => {
    const lines = buildMetricLines(
      makeComparison({
        relativeMetrics: [
          {
            metric: 'uiStartup',
            percentile: 'p95',
            current: 1500,
            baseline: 1400,
            delta: 100,
            deltaPercent: 0.071,
            severity: COMPARISON_SEVERITY.Warn.value,
            indication: COMPARISON_SEVERITY.Warn.icon,
          },
        ],
      }),
    );

    expect(lines).toHaveLength(1);
    expect(lines[0].metric).toBe('uiStartup');
    expect(lines[0].icon).toBe(COMPARISON_SEVERITY.Warn.icon);
    expect(lines[0].hasIssue).toBe(true);
    expect(lines[0].details).toContain('1500ms');
    expect(lines[0].details).toContain('p95');
  });

  it('overrides icon with 🔴 when absolute Fail violation matches the metric', () => {
    const lines = buildMetricLines(
      makeComparison({
        relativeMetrics: [
          {
            metric: 'uiStartup',
            percentile: 'p95',
            current: 6000,
            baseline: 1400,
            delta: 4600,
            deltaPercent: 3.28,
            severity: COMPARISON_SEVERITY.Regression.value,
            indication: COMPARISON_SEVERITY.Regression.icon,
          },
        ],
        absoluteViolations: [
          {
            metricId: 'uiStartup',
            percentile: 'p95',
            value: 6000,
            threshold: 4800,
            severity: THRESHOLD_SEVERITY.Fail,
          },
        ],
      }),
    );

    expect(lines[0].icon).toBe(COMPARISON_SEVERITY.Regression.icon);
    expect(lines[0].hasIssue).toBe(true);
  });

  it('overrides icon with 🟡 when absolute Warn violation matches the metric', () => {
    const lines = buildMetricLines(
      makeComparison({
        relativeMetrics: [
          {
            metric: 'uiStartup',
            percentile: 'p75',
            current: 3200,
            baseline: 1400,
            delta: 1800,
            deltaPercent: 1.28,
            severity: COMPARISON_SEVERITY.Regression.value,
            indication: COMPARISON_SEVERITY.Regression.icon,
          },
        ],
        absoluteViolations: [
          {
            metricId: 'uiStartup',
            percentile: 'p75',
            value: 3200,
            threshold: 3000,
            severity: THRESHOLD_SEVERITY.Warn,
          },
        ],
      }),
    );

    expect(lines[0].icon).toBe(COMPARISON_SEVERITY.Warn.icon);
    expect(lines[0].hasIssue).toBe(true);
  });

  it('shows violation value with (no baseline) when no relative metric exists for the key', () => {
    const lines = buildMetricLines(
      makeComparison({
        absoluteViolations: [
          {
            metricId: 'uiStartup',
            percentile: 'p95',
            value: 6000,
            threshold: 4800,
            severity: THRESHOLD_SEVERITY.Fail,
          },
        ],
      }),
    );

    expect(lines).toHaveLength(1);
    expect(lines[0].icon).toBe(COMPARISON_SEVERITY.Regression.icon);
    expect(lines[0].hasIssue).toBe(true);
    expect(lines[0].details).toContain('no baseline');
    expect(lines[0].details).toContain('6000ms');
  });

  it('shows 🟢 with (no baseline) for a violation-free metric absent from relative metrics', () => {
    const lines = buildMetricLines(
      makeComparison({
        relativeMetrics: [],
        absoluteViolations: [],
      }),
    );
    expect(lines).toHaveLength(0);
  });

  it('shows only icon when metric passes (no timing details)', () => {
    const lines = buildMetricLines(
      makeComparison({
        relativeMetrics: [
          {
            metric: 'uiStartup',
            percentile: 'p95',
            current: 1450,
            baseline: 1400,
            delta: 50,
            deltaPercent: 0.036, // +3.6% → pass
            severity: COMPARISON_SEVERITY.Pass.value,
            indication: COMPARISON_SEVERITY.Pass.icon,
          },
        ],
        absoluteViolations: [],
      }),
    );

    expect(lines).toHaveLength(1);
    expect(lines[0].icon).toBe(COMPARISON_SEVERITY.Pass.icon);
    expect(lines[0].hasIssue).toBe(false);
    expect(lines[0].details).toBeUndefined();
  });

  it('shows 🟡 when relative regression exists but no absolute violation', () => {
    const lines = buildMetricLines(
      makeComparison({
        relativeMetrics: [
          {
            metric: 'uiStartup',
            percentile: 'p95',
            current: 1560,
            baseline: 1400,
            delta: 160,
            deltaPercent: 0.114, // +11.4% → regression
            severity: COMPARISON_SEVERITY.Regression.value,
            indication: COMPARISON_SEVERITY.Regression.icon,
          },
        ],
        absoluteViolations: [],
      }),
    );

    expect(lines).toHaveLength(1);
    expect(lines[0].icon).toBe(COMPARISON_SEVERITY.Warn.icon);
    expect(lines[0].hasIssue).toBe(true);
    expect(lines[0].details).toContain('1560ms');
  });
});
