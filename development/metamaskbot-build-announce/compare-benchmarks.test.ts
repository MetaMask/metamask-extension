import { promises as fs } from 'fs';
import type { BenchmarkResults } from '../../shared/constants/benchmarks';
import { THRESHOLD_SEVERITY } from '../../shared/constants/benchmarks';
import { ADMITTED_SERIES } from '../../test/e2e/benchmarks/utils/gated-metrics';
import { makeShiftedFlowResults } from '../../test/e2e/benchmarks/utils/fixtures/paired-results';
import type { PairedOrder } from '../../test/e2e/benchmarks/utils/paired';
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
  metricId: string,
  overrides: Partial<BenchmarkResults> = {},
): BenchmarkResults {
  return {
    testTitle: 'test',
    persona: 'standard',
    mean: { [metricId]: 1500 },
    min: { [metricId]: 1000 },
    max: { [metricId]: 2000 },
    stdDev: { [metricId]: 200 },
    p75: { [metricId]: 1800 },
    p95: { [metricId]: 2200 },
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
          name: 'benchmark-chrome-webpack-userJourneyOnboardingImport',
          data: {
            onboardingImportWallet: makeBenchmarkResults(
              'importWalletToSocialScreen',
              {
                p75: { importWalletToSocialScreen: 1500 },
                p95: { importWalletToSocialScreen: 2000 },
                mean: { importWalletToSocialScreen: 1200 },
              },
            ),
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
          name: 'benchmark-chrome-webpack-userJourneyOnboardingImport',
          data: {
            onboardingImportWallet: makeBenchmarkResults(
              'importWalletToSocialScreen',
              {
                p75: { importWalletToSocialScreen: 1500 },
                p95: { importWalletToSocialScreen: 2000 },
                mean: { importWalletToSocialScreen: 1200 },
              },
            ),
          },
        },
      ];

      const result = runComparison(benchmarks, {});
      expect(result.comparisons[0].source).toBe('chrome-webpack');
    });

    for (const [benchmarkName, metricId] of [
      ['startupStandardHome', 'uiStartup'],
      ['onboardingImportWallet', 'total'],
    ]) {
      it(`reports a breach of the fixed limit on ${benchmarkName}.${metricId} and does not block`, () => {
        const benchmarks = [
          {
            name: `benchmark-chrome-webpack-${benchmarkName}`,
            data: {
              [benchmarkName]: makeBenchmarkResults(metricId, {
                p75: { [metricId]: 99999 },
                p95: { [metricId]: 99999 },
                mean: { [metricId]: 99999 },
              }),
            },
          },
        ];

        const result = runComparison(benchmarks, {});
        expect(result.anyFailed).toBe(false);
        expect(result.paired).toStrictEqual([]);
        expect(result.comparisons[0].hasWarning).toBe(true);
        expect(
          result.comparisons[0].absoluteViolations.every(
            (v) => v.severity === THRESHOLD_SEVERITY.Warn,
          ),
        ).toBe(true);
      });
    }

    it('does not fail when an unadmitted metric exceeds its fail threshold', () => {
      const benchmarks = [
        {
          name: 'benchmark-chrome-webpack-userJourneyOnboardingImport',
          data: {
            onboardingImportWallet: makeBenchmarkResults(
              'importWalletToSocialScreen',
              {
                p75: { importWalletToSocialScreen: 99999 },
                p95: { importWalletToSocialScreen: 99999 },
                mean: { importWalletToSocialScreen: 99999 },
              },
            ),
          },
        },
      ];

      const result = runComparison(benchmarks, {});
      expect(result.anyFailed).toBe(false);
      expect(
        result.comparisons[0].absoluteViolations.every(
          (v) => v.severity === THRESHOLD_SEVERITY.Warn,
        ),
      ).toBe(true);
      expect(result.comparisons[0].hasWarning).toBe(true);
    });

    const DEMOTED_BIMODAL_METRICS: {
      artifactName: string;
      benchmarkName: string;
      metricId: string;
    }[] = [
      {
        artifactName: 'benchmark-chrome-webpack-userJourneyOnboardingNew',
        benchmarkName: 'onboardingNewWallet',
        metricId: 'total',
      },
      {
        artifactName: 'benchmark-chrome-webpack-userJourneyOnboardingNew',
        benchmarkName: 'onboardingNewWallet',
        metricId: 'doneButtonToAssetList',
      },
      {
        artifactName: 'benchmark-chrome-webpack-userJourneyOnboardingImport',
        benchmarkName: 'onboardingImportWallet',
        metricId: 'doneButtonToHomeScreen',
      },
    ];

    for (const {
      artifactName,
      benchmarkName,
      metricId,
    } of DEMOTED_BIMODAL_METRICS) {
      it(`reports a breach of the bimodal metric ${benchmarkName}.${metricId} and does not block`, () => {
        const benchmarks = [
          {
            name: artifactName,
            data: {
              [benchmarkName]: makeBenchmarkResults(metricId, {
                p75: { [metricId]: 99999 },
                p95: { [metricId]: 99999 },
                mean: { [metricId]: 99999 },
              }),
            },
          },
        ];

        const result = runComparison(benchmarks, {});
        expect(result.anyFailed).toBe(false);
        expect(
          result.comparisons[0].absoluteViolations.every(
            (v) => v.severity === THRESHOLD_SEVERITY.Warn,
          ),
        ).toBe(true);
        expect(result.comparisons[0].hasWarning).toBe(true);
      });
    }

    it('includes relative metrics when baseline is available', () => {
      const benchmarks = [
        {
          name: 'benchmark-chrome-webpack-userJourneyOnboardingImport',
          data: {
            onboardingImportWallet: makeBenchmarkResults(
              'importWalletToSocialScreen',
              {
                p75: { importWalletToSocialScreen: 1500 },
                p95: { importWalletToSocialScreen: 2000 },
                mean: { importWalletToSocialScreen: 1200 },
              },
            ),
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
          name: 'benchmark-chrome-webpack-startupStandardHome',
          data: {
            startupStandardHome: makeBenchmarkResults('uiStartup', {
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

    it('applies CV-adaptive widening when the derived CV is in the adaptive band', () => {
      const originalCI = process.env.CI;
      process.env.CI = 'true';
      try {
        // startupPowerUserHome.uiStartup: warn=4000, fail=4700, ciMultiplier=2.0.
        // mean=3000, stdDev=1200 → CV=40 → adjustment=1.2.
        // Effective fail = 4700 × 2.0 × 1.2 = 11280; p75=12000 exceeds it.
        const benchmarks = [
          {
            name: 'benchmark-chrome-webpack-startupPowerUserHome',
            data: {
              startupPowerUserHome: makeBenchmarkResults('uiStartup', {
                persona: 'powerUser',
                mean: { uiStartup: 3000 },
                stdDev: { uiStartup: 1200 },
                p75: { uiStartup: 12000 },
                p95: { uiStartup: 12000 },
              }),
            },
          },
        ];

        const result = runComparison(benchmarks, {});
        const violation = result.comparisons[0].absoluteViolations.find(
          (v) => v.metricId === 'uiStartup' && v.percentile === 'p75',
        );
        expect(violation).toBeDefined();
        // CV widening (cvAdjustment, threshold) is recorded by
        // validateResultThresholds before gating; the gating policy then
        // downgrades severity since startupPowerUserHome.uiStartup is not
        // allowlisted, so anyFailed stays false.
        expect(violation?.cvAdjustment).toBeCloseTo(1.2);
        expect(violation?.threshold).toBeCloseTo(11280);
        expect(violation?.severity).toBe(THRESHOLD_SEVERITY.Warn);
        expect(result.anyFailed).toBe(false);
      } finally {
        process.env.CI = originalCI;
      }
    });

    it('does not record cvAdjustment when the derived CV is outside the adaptive band', () => {
      const originalCI = process.env.CI;
      process.env.CI = 'true';
      try {
        // mean=3000, stdDev=300 → CV=10 — below the 25% floor, no adjustment.
        const benchmarks = [
          {
            name: 'benchmark-chrome-webpack-startupPowerUserHome',
            data: {
              startupPowerUserHome: makeBenchmarkResults('uiStartup', {
                persona: 'powerUser',
                mean: { uiStartup: 3000 },
                stdDev: { uiStartup: 300 },
                p75: { uiStartup: 12000 },
                p95: { uiStartup: 12000 },
              }),
            },
          },
        ];

        const result = runComparison(benchmarks, {});
        const violation = result.comparisons[0].absoluteViolations.find(
          (v) => v.metricId === 'uiStartup' && v.percentile === 'p75',
        );
        expect(violation).toBeDefined();
        expect(violation?.cvAdjustment).toBeUndefined();
      } finally {
        process.env.CI = originalCI;
      }
    });

    it('routes non-allowlisted breach into the WARN section of printReport', () => {
      // End-to-end: runComparison + printReport. A non-gated fail should
      // surface in WARN, not FAIL, and not change the overall PASS verdict.
      const benchmarks = [
        {
          name: 'benchmark-chrome-webpack-userJourneyOnboardingImport',
          data: {
            onboardingImportWallet: makeBenchmarkResults(
              'importWalletToSocialScreen',
              {
                p75: { importWalletToSocialScreen: 99999 },
                p95: { importWalletToSocialScreen: 99999 },
                mean: { importWalletToSocialScreen: 99999 },
              },
            ),
          },
        },
      ];

      const result = runComparison(benchmarks, {});
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      try {
        printReport(result);
        const allCalls = consoleSpy.mock.calls.flat().join('\n');
        expect(allCalls).toContain('WARN  onboardingImportWallet');
        expect(allCalls).not.toMatch(/FAIL\s+onboardingImportWallet/u);
        expect(allCalls).toContain('PASS — no admitted series blocked');
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it('skips entries with no matching threshold config', () => {
      const benchmarks = [
        {
          name: 'unknown-benchmark',
          data: {
            'unknown-benchmark': makeBenchmarkResults('uiStartup'),
          },
        },
      ];

      const result = runComparison(benchmarks, {});
      expect(result.comparisons).toHaveLength(0);
    });

    it('skips entries from failed benchmark runs (missing p75/p95)', () => {
      const benchmarks = [
        {
          name: 'benchmark-chrome-webpack-startupStandardHome',
          data: {
            startupStandardHome: { error: 'Browser crashed' } as never,
          },
        },
      ];

      const result = runComparison(benchmarks, {});
      expect(result.comparisons).toHaveLength(0);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('missing p75/p95'),
      );
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

describe('the gate on admitted series', () => {
  const bridgeIds = ADMITTED_SERIES.filter(({ series }) =>
    series.startsWith('bridgeUserActions.'),
  ).map(({ series }) => series.slice('bridgeUserActions.'.length));
  const orders: PairedOrder[] = [
    'base-head-head-base',
    'head-base-base-head',
    'base-head-head-base',
    'head-base-base-head',
  ];

  /** The four jobs a comparison of eight differences needs, as artifacts. */
  const bridgeJobs = (
    shift: number,
    unadmitted: Record<string, number> = {},
    jobs = orders,
  ) =>
    jobs.map((order, index) => ({
      name: `benchmark-chrome-webpack-bridgeUserActions-r${Math.floor(index / 2) + 1}-${order}`,
      data: {
        bridgeUserActions: makeShiftedFlowResults(
          order,
          bridgeIds,
          shift,
        ) as unknown as BenchmarkResults,
        ...Object.fromEntries(
          Object.entries(unadmitted).map(([flow, flowShift]) => [
            flow,
            makeShiftedFlowResults(
              order,
              ['step'],
              flowShift,
            ) as unknown as BenchmarkResults,
          ]),
        ),
      },
    }));

  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('blocks on a paired result whose lower bound exceeds δ_block', () => {
    const result = runComparison(bridgeJobs(100), {});

    expect(result.anyFailed).toBe(true);
    expect(result.paired.map(({ verdict }) => verdict)).toStrictEqual(
      bridgeIds.map(() => 'block'),
    );
  });

  it('passes a paired result within δ_block', () => {
    const result = runComparison(bridgeJobs(10), {});

    expect(result.anyFailed).toBe(false);
    expect(result.paired.map(({ verdict }) => verdict)).toStrictEqual(
      bridgeIds.map(() => 'no-block'),
    );
  });

  it('fails an inconclusive result: two jobs give four differences, too few for a bound', () => {
    const result = runComparison(bridgeJobs(0, {}, orders.slice(0, 2)), {});

    expect(result.anyFailed).toBe(true);
    expect(result.paired.map(({ verdict }) => verdict)).toStrictEqual(
      bridgeIds.map(() => 'unable'),
    );
  });

  it('fails a leg that only carries an error', () => {
    const result = runComparison(
      [
        {
          name: 'benchmark-chrome-webpack-bridgeUserActions-base-head-head-base',
          data: {
            bridgeUserActions: {
              error: 'Error: no iteration gave a value',
            } as unknown as BenchmarkResults,
          },
        },
      ],
      {},
    );

    expect(result.anyFailed).toBe(true);
    expect(result.comparisons).toHaveLength(0);
    expect(result.paired.every(({ verdict }) => verdict === 'incomplete')).toBe(
      true,
    );
  });

  it('does not block on an unadmitted series that shifts by 5 s', () => {
    const result = runComparison(bridgeJobs(0, { confirmTx: 5000 }), {});

    expect(result.anyFailed).toBe(false);
  });

  it('checks one leg for values without deciding it', () => {
    const result = runComparison(bridgeJobs(500).slice(0, 1), {}, false);

    expect(result.anyFailed).toBe(false);
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

  const blockedSeries = {
    source: 'chrome-webpack',
    series: 'bridgeUserActions.bridge_load_page',
    deltaBlockMs: 33,
    verdict: 'block' as const,
    failed: true,
    problems: [],
    decision: {
      n: 8,
      shift: 120,
      lower: 90,
      k: 6,
      attainedLevel: 0.0391,
      verdict: 'block' as const,
    },
  };

  it('prints PASS result when no admitted series failed', () => {
    printReport({ comparisons: [], paired: [], anyFailed: false });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('PASS — no admitted series blocked'),
    );
  });

  it('prints FAIL result and the series when an admitted series blocked', () => {
    printReport({
      comparisons: [],
      paired: [blockedSeries],
      anyFailed: true,
    });

    const allCalls = consoleSpy.mock.calls.flat().join('\n');
    expect(allCalls).toContain('FAIL — an admitted series blocked');
    expect(allCalls).toContain(
      'FAIL  bridgeUserActions.bridge_load_page [chrome-webpack]: block, 8 differences, shift 120.0ms, lower bound 90.0ms against δ_block 33.0ms',
    );
  });

  it('shows passing comparison in grouped PASS section', () => {
    printReport({
      comparisons: [
        makeComparison({
          benchmarkName: 'loadNewAccount',
          source: 'chrome-webpack',
        }),
      ],
      paired: [],
      anyFailed: false,
    });

    const allCalls = consoleSpy.mock.calls.flat().join('\n');
    expect(allCalls).toContain('1 benchmarks within thresholds');
    expect(allCalls).toContain('loadNewAccount');
    expect(allCalls).toContain('chrome-webpack');
  });

  it('groups passing entries without baseline into PASS section', () => {
    printReport({
      comparisons: [
        makeComparison({ relativeMetrics: [], absoluteViolations: [] }),
      ],
      paired: [],
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
          source: 'chrome-webpack',
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
      paired: [],
      anyFailed: false,
    });

    const allCalls = consoleSpy.mock.calls.flat().join('\n');
    expect(allCalls).toContain('1 benchmarks within thresholds');
    expect(allCalls).toContain('standardHome: chrome-webpack');
    expect(allCalls).not.toContain('[Show logs]');
  });

  it('prints a breach of a fixed limit as a warning', () => {
    const { THRESHOLD_SEVERITY: TS } = jest.requireActual(
      '../../shared/constants/benchmarks',
    ) as typeof import('../../shared/constants/benchmarks');
    printReport({
      comparisons: [
        makeComparison({
          benchmarkName: 'standardHome',
          source: 'chrome-webpack',
          hasWarning: true,
          absoluteViolations: [
            {
              metricId: 'uiStartup',
              percentile: 'p95',
              value: 6000,
              threshold: 4800,
              severity: TS.Warn,
            },
          ],
        }),
      ],
      paired: [],
      anyFailed: false,
    });

    const allCalls = consoleSpy.mock.calls.flat().join('\n');
    expect(allCalls).toContain('WARN  standardHome [chrome-webpack]');
    expect(allCalls).toContain('uiStartup');
    expect(allCalls).not.toContain('FAIL  standardHome');
  });

  it('reports counts of failed admitted series, other benchmarks and warnings', () => {
    const { THRESHOLD_SEVERITY: TS } = jest.requireActual(
      '../../shared/constants/benchmarks',
    ) as typeof import('../../shared/constants/benchmarks');
    printReport({
      comparisons: [
        makeComparison({ benchmarkName: 'A' }),
        makeComparison({
          benchmarkName: 'B',
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
        makeComparison({ benchmarkName: 'C' }),
      ],
      paired: [blockedSeries],
      anyFailed: true,
    });

    const allCalls = consoleSpy.mock.calls.flat().join('\n');
    expect(allCalls).toContain('1 admitted series');
    expect(allCalls).toContain('1 failed');
    expect(allCalls).toContain('3 other benchmarks');
    expect(allCalls).toContain('1 warnings');
  });

  it('groups multiple sources for the same benchmark name in PASS section', () => {
    printReport({
      comparisons: [
        makeComparison({
          benchmarkName: 'startupStandardHome',
          source: 'chrome-webpack',
        }),
        makeComparison({
          benchmarkName: 'startupStandardHome',
          source: 'firefox-webpack',
        }),
      ],
      paired: [],
      anyFailed: false,
    });

    const allCalls = consoleSpy.mock.calls.flat().join('\n');
    expect(allCalls).toContain('2 benchmarks within thresholds');
    expect(allCalls).toContain(
      'startupStandardHome: chrome-webpack, firefox-webpack',
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

  it('reports the absolute ceiling, not the relative improvement, on an absolute-only fail', () => {
    // Observed on a live benchmark run (onboardingImportWallet total.p75):
    // the metric fails the absolute ceiling (11291 > 11050ms) while the
    // relative delta is a stale-baseline improvement (-72.1%). The line must
    // attribute the failure to the ceiling, never paint the improvement as
    // the reason.
    const lines = buildMetricLines(
      makeComparison({
        relativeMetrics: [
          {
            metric: 'total',
            percentile: 'p75',
            current: 11291,
            baseline: 40000,
            delta: -28709,
            deltaPercent: -0.721,
            severity: COMPARISON_SEVERITY.Pass.value,
            indication: COMPARISON_SEVERITY.Pass.icon,
          },
        ],
        absoluteViolations: [
          {
            metricId: 'total',
            percentile: 'p75',
            value: 11291,
            threshold: 11050,
            severity: THRESHOLD_SEVERITY.Fail,
          },
        ],
      }),
    );

    const { details } = lines[0];
    expect(details).toContain('absolute ceiling exceeded');
    expect(details).toContain('11291ms');
    expect(details).toContain('11050ms');
    expect(details).not.toContain('-72.1%');
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
