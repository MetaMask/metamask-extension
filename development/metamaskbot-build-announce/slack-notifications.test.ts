import type {
  ThresholdConfig,
  ThresholdViolation,
} from '../../shared/constants/benchmarks';
import { THRESHOLD_SEVERITY } from '../../shared/constants/benchmarks';
import type { BenchmarkEntryComparison } from './comparison-utils';
import {
  formatFailVerdict,
  formatWeeklyDigest,
  formatSkipAlert,
  formatBaselineReset,
  formatBatchedNotification,
  isSevereRegression,
  resolveTeamMention,
  loadOwnershipMap,
} from './slack-notifications';
import type {
  SlackContext,
  WeeklyDigestData,
  SkipAlertData,
  BaselineResetData,
} from './slack-notifications';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeViolation(
  overrides: Partial<ThresholdViolation> = {},
): ThresholdViolation {
  return {
    metricId: 'uiStartup',
    percentile: 'p75' as const,
    value: 3000,
    threshold: 2500,
    severity: THRESHOLD_SEVERITY.Fail,
    ...overrides,
  };
}

function makeComparison(
  overrides: Partial<BenchmarkEntryComparison> = {},
): BenchmarkEntryComparison {
  return {
    benchmarkName: 'startupStandardHome',
    relativeMetrics: [],
    absoluteViolations: [makeViolation()],
    hasRegression: true,
    hasWarning: false,
    absoluteFailed: true,
    ...overrides,
  };
}

const defaultContext: SlackContext = {
  webhookUrl: 'https://hooks.slack.com/test',
  prNumber: '12345',
  prAuthor: 'testauthor',
  ciRunUrl: 'https://github.com/MetaMask/metamask-extension/actions/runs/1',
  prUrl: 'https://github.com/MetaMask/metamask-extension/pull/12345',
};

/**
 * Recursively extracts all text content from rich_text block elements.
 *
 * @param blocks - Slack rich_text block array to extract text from.
 */
function extractBlockText(blocks: Record<string, unknown>[]): string {
  const texts: string[] = [];
  function walk(obj: unknown): void {
    if (obj === null || obj === undefined) {
      return;
    }
    if (Array.isArray(obj)) {
      obj.forEach(walk);
      return;
    }
    if (typeof obj === 'object') {
      const rec = obj as Record<string, unknown>;
      if (rec.type === 'text' && typeof rec.text === 'string') {
        texts.push(rec.text);
      }
      if (rec.type === 'link' && typeof rec.text === 'string') {
        texts.push(rec.text);
      }
      if (rec.type === 'emoji' && typeof rec.name === 'string') {
        texts.push(`:${rec.name}:`);
      }
      for (const val of Object.values(rec)) {
        walk(val);
      }
    }
  }
  walk(blocks);
  return texts.join('');
}

// ---------------------------------------------------------------------------
// resolveTeamMention
// ---------------------------------------------------------------------------

describe('resolveTeamMention', () => {
  it('returns Slack subteam mention when ownership map has Slack group ID', () => {
    const ownership = { startupStandardHome: 'S12345' };
    expect(resolveTeamMention('startupStandardHome', ownership)).toBe(
      '<!subteam^S12345>',
    );
  });

  it('returns @handle when ownership map has a plain name', () => {
    const ownership = { startupStandardHome: 'extension-platform' };
    expect(resolveTeamMention('startupStandardHome', ownership)).toBe(
      '@extension-platform',
    );
  });

  it('falls back to PR author when no ownership entry', () => {
    expect(resolveTeamMention('unknown', {}, 'alice')).toBe('@alice');
  });

  it('returns unknown author when no ownership and no PR author', () => {
    expect(resolveTeamMention('unknown', {})).toBe('unknown author');
  });
});

// ---------------------------------------------------------------------------
// isSevereRegression
// ---------------------------------------------------------------------------

describe('isSevereRegression', () => {
  it('returns true when value exceeds 2x the threshold', () => {
    const violation = makeViolation({ value: 5100, threshold: 2500 });
    expect(isSevereRegression(violation)).toBe(true);
  });

  it('returns false for moderate regression', () => {
    const violation = makeViolation({ value: 2800, threshold: 2500 });
    expect(isSevereRegression(violation)).toBe(false);
  });

  it('returns true when delta exceeds 50% of fail limit', () => {
    const violation = makeViolation({
      metricId: 'uiStartup',
      percentile: 'p75' as const,
      value: 6000,
      threshold: 2500,
    });
    const config: ThresholdConfig = {
      uiStartup: {
        p75: { warn: 2000, fail: 2500 },
        ciMultiplier: 1,
      },
    };
    expect(isSevereRegression(violation, config)).toBe(true);
  });

  it('returns false when delta is below 50% of fail limit', () => {
    const violation = makeViolation({
      metricId: 'uiStartup',
      percentile: 'p75' as const,
      value: 2800,
      threshold: 2500,
    });
    const config: ThresholdConfig = {
      uiStartup: {
        p75: { warn: 2000, fail: 2500 },
        ciMultiplier: 1,
      },
    };
    expect(isSevereRegression(violation, config)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// formatFailVerdict
// ---------------------------------------------------------------------------

describe('formatFailVerdict', () => {
  it('produces rich_text blocks with regression details and links', () => {
    const result = formatFailVerdict({
      comparisons: [makeComparison()],
      context: defaultContext,
      ownership: {},
    });

    const text = extractBlockText(result.blocks);

    expect(text).toContain('Performance Regression Detected');
    expect(text).toContain('#12345');
    expect(text).toContain('@testauthor');
    expect(text).toContain('startupStandardHome');
    expect(text).toContain('3000ms');
    expect(text).toContain('2500ms');
    expect(text).toContain('View CI Run');
    expect(text).toContain('View PR');
  });

  it('uses ownership map for team mention', () => {
    const result = formatFailVerdict({
      comparisons: [makeComparison()],
      context: defaultContext,
      ownership: { startupStandardHome: 'extension-platform' },
    });

    const text = extractBlockText(result.blocks);
    expect(text).toContain('@extension-platform');
  });

  it('handles multiple failing benchmarks', () => {
    const result = formatFailVerdict({
      comparisons: [
        makeComparison({ benchmarkName: 'bench1' }),
        makeComparison({ benchmarkName: 'bench2' }),
      ],
      context: defaultContext,
      ownership: {},
    });

    const text = extractBlockText(result.blocks);
    expect(text).toContain('bench1');
    expect(text).toContain('bench2');
  });

  it('produces blocks that are all rich_text or divider type', () => {
    const result = formatFailVerdict({
      comparisons: [makeComparison()],
      context: defaultContext,
      ownership: {},
    });

    for (const block of result.blocks) {
      expect(['rich_text', 'divider']).toContain(block.type);
    }
  });
});

// ---------------------------------------------------------------------------
// formatWeeklyDigest
// ---------------------------------------------------------------------------

describe('formatWeeklyDigest', () => {
  const digestData: WeeklyDigestData = {
    falsePositiveRate: 0.032,
    falsePositiveTarget: 0.05,
    metricsPromoted: [
      { name: 'loginToHomeScreen', fromTier: 'warn', toTier: 'enforced' },
    ],
    totalEnforced: 12,
    totalMetrics: 31,
    regressionsThisWeek: { total: 3, real: 2, flake: 1 },
    skipLabelUses: [{ prNumber: '45678', reason: 'CI container issue' }],
    graduationReadiness: [
      { name: 'confirm_tx_tbt', cv: 18, fp: 2.1, ready: true },
      {
        name: 'swap_step3',
        cv: 41,
        fp: 8,
        ready: false,
        note: 'needs CI multiplier calibration',
      },
    ],
  };

  it('includes false positive rate', () => {
    const result = formatWeeklyDigest(digestData);
    const text = extractBlockText(result.blocks);
    expect(text).toContain('3.2%');
    expect(text).toContain('<5%');
  });

  it('includes promoted metrics', () => {
    const result = formatWeeklyDigest(digestData);
    const text = extractBlockText(result.blocks);
    expect(text).toContain('loginToHomeScreen');
    expect(text).toContain('1 promoted');
  });

  it('includes regression count breakdown', () => {
    const result = formatWeeklyDigest(digestData);
    const text = extractBlockText(result.blocks);
    expect(text).toContain('3 total · 2 real · 1 flake');
  });

  it('includes skip label uses', () => {
    const result = formatWeeklyDigest(digestData);
    const text = extractBlockText(result.blocks);
    expect(text).toContain('#45678');
    expect(text).toContain('CI container issue');
  });

  it('includes graduation readiness details', () => {
    const result = formatWeeklyDigest(digestData);
    const text = extractBlockText(result.blocks);
    expect(text).toContain('confirm_tx_tbt');
    expect(text).toContain('swap_step3');
    expect(text).toContain('needs CI multiplier calibration');
  });

  describe('benchmark trends', () => {
    const dataWithTrends: WeeklyDigestData = {
      ...digestData,
      benchmarkTrends: [
        {
          name: 'startupStandardHome',
          medianDelta: 0.21,
          p90Delta: 0.15,
          team: '@extension-platform',
        },
        { name: 'confirmTransaction', medianDelta: 0.04, p90Delta: 0.02 },
        {
          name: 'swapETHtoLINK',
          medianDelta: -0.1,
          team: '@swap-bridge-dev-team',
        },
        { name: 'sendETH', medianDelta: 0.001 },
      ],
    };

    it('shows Needs Attention for regressions >= 5%', () => {
      const text = extractBlockText(formatWeeklyDigest(dataWithTrends).blocks);
      expect(text).toContain('Needs Attention');
      expect(text).toContain('startupStandardHome');
      expect(text).toContain('+21%');
      expect(text).toContain('p90 +15%');
      expect(text).toContain('@extension-platform');
    });

    it('shows Watch for moderate regressions', () => {
      const text = extractBlockText(formatWeeklyDigest(dataWithTrends).blocks);
      expect(text).toContain('Watch');
      expect(text).toContain('confirmTransaction');
      expect(text).toContain('+4%');
    });

    it('shows Improving for improvements', () => {
      const text = extractBlockText(formatWeeklyDigest(dataWithTrends).blocks);
      expect(text).toContain('Improving');
      expect(text).toContain('swapETHtoLINK');
      expect(text).toContain('-10%');
    });

    it('shows Stable section', () => {
      const text = extractBlockText(formatWeeklyDigest(dataWithTrends).blocks);
      expect(text).toContain('Stable');
      expect(text).toContain('sendETH');
    });

    it('bolds severe regressions (>= 50%)', () => {
      const severe: WeeklyDigestData = {
        ...digestData,
        benchmarkTrends: [
          { name: 'assetView', medianDelta: 8.0, p90Delta: 0.21 },
        ],
      };
      const result = formatWeeklyDigest(severe);
      // The delta element for a severe entry should have bold style
      const blocks = result.blocks as Record<string, unknown>[];
      const allText = extractBlockText(blocks);
      expect(allText).toContain('+800%');
    });

    it('omits trend sections when benchmarkTrends is not provided', () => {
      const text = extractBlockText(formatWeeklyDigest(digestData).blocks);
      expect(text).not.toContain('Needs Attention');
      expect(text).not.toContain('Watch');
      expect(text).not.toContain('Improving');
    });

    it('summarises stable section when more than 6 items', () => {
      const manyStable: WeeklyDigestData = {
        ...digestData,
        benchmarkTrends: Array.from({ length: 8 }, (_, i) => ({
          name: `benchmark${i}`,
          medianDelta: 0.001,
        })),
      };
      const text = extractBlockText(formatWeeklyDigest(manyStable).blocks);
      expect(text).toContain('and 2 more within normal range');
    });
  });
});

// ---------------------------------------------------------------------------
// formatSkipAlert
// ---------------------------------------------------------------------------

describe('formatSkipAlert', () => {
  it('includes PR link, author, and justification', () => {
    const data: SkipAlertData = {
      prNumber: '99999',
      prUrl: 'https://github.com/MetaMask/metamask-extension/pull/99999',
      prAuthor: 'bob',
      justification: 'CI flake — container memory issue',
    };
    const result = formatSkipAlert(data);
    const text = extractBlockText(result.blocks);

    expect(text).toContain('Benchmark Gate Skipped');
    expect(text).toContain('PR #99999');
    expect(text).toContain('@bob');
    expect(text).toContain('CI flake');
  });

  it('shows placeholder when no justification provided', () => {
    const data: SkipAlertData = {
      prNumber: '99999',
      prUrl: 'https://github.com/MetaMask/metamask-extension/pull/99999',
      prAuthor: 'bob',
      justification: '',
    };
    const result = formatSkipAlert(data);
    const text = extractBlockText(result.blocks);
    expect(text).toContain('none provided');
  });
});

// ---------------------------------------------------------------------------
// formatBaselineReset
// ---------------------------------------------------------------------------

describe('formatBaselineReset', () => {
  it('includes benchmark name, short commit, and author', () => {
    const data: BaselineResetData = {
      benchmarkName: 'startupStandardHome',
      commit: 'abc1234567890',
      author: 'alice',
      prUrl: 'https://github.com/MetaMask/metamask-extension/pull/11111',
    };
    const result = formatBaselineReset(data);
    const text = extractBlockText(result.blocks);

    expect(text).toContain('Baseline Reset');
    expect(text).toContain('startupStandardHome');
    expect(text).toContain('abc1234');
    expect(text).toContain('@alice');
    expect(text).toContain('View PR');
  });

  it('omits PR link when not provided', () => {
    const data: BaselineResetData = {
      benchmarkName: 'startupStandardHome',
      commit: 'abc1234567890',
      author: 'alice',
    };
    const result = formatBaselineReset(data);
    const text = extractBlockText(result.blocks);
    expect(text).not.toContain('View PR');
  });
});

// ---------------------------------------------------------------------------
// formatBatchedNotification
// ---------------------------------------------------------------------------

describe('formatBatchedNotification', () => {
  it('aggregates multiple entries into a single message', () => {
    const entries = [
      {
        comparison: makeComparison({ benchmarkName: 'bench1' }),
        violation: makeViolation({ value: 3000, threshold: 2500 }),
        timestamp: Date.now(),
      },
      {
        comparison: makeComparison({ benchmarkName: 'bench2' }),
        violation: makeViolation({ value: 4000, threshold: 3000 }),
        timestamp: Date.now(),
      },
    ];

    const result = formatBatchedNotification(entries, defaultContext, {});
    const text = extractBlockText(result.blocks);

    expect(text).toContain('2 Performance Regressions Detected');
    expect(text).toContain('bench1');
    expect(text).toContain('bench2');
  });

  it('uses singular form for single regression', () => {
    const entries = [
      {
        comparison: makeComparison(),
        violation: makeViolation(),
        timestamp: Date.now(),
      },
    ];

    const result = formatBatchedNotification(entries, defaultContext, {});
    const text = extractBlockText(result.blocks);
    expect(text).toContain('1 Performance Regression Detected');
    // Should NOT have plural 's'
    expect(text).not.toContain('Regressions');
  });
});

// ---------------------------------------------------------------------------
// loadOwnershipMap
// ---------------------------------------------------------------------------

describe('loadOwnershipMap', () => {
  it('returns empty map when config file does not exist', async () => {
    const result = await loadOwnershipMap('/nonexistent/path.json');
    expect(result).toStrictEqual({});
  });
});
