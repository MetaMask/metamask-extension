import { promises as fs } from 'fs';
import path from 'path';

import type { ThresholdConfig } from '../../shared/constants/benchmarks';

import {
  validateOverrides,
  loadOverrides,
  applyOverrides,
  formatOverrideSummary,
  formatOverrideHtml,
  type ThresholdOverrideFile,
  type AppliedOverride,
} from './threshold-overrides';

const FIXTURES_DIR = path.join(__dirname, '__fixtures__');

const makeRegistry = (): Record<string, ThresholdConfig> => ({
  startupStandardHome: {
    uiStartup: {
      p75: { warn: 2000, fail: 2500 },
      p95: { warn: 2500, fail: 3200 },
      ciMultiplier: 1.5,
    },
    load: {
      p75: { warn: 1600, fail: 2200 },
      p95: { warn: 2200, fail: 2800 },
      ciMultiplier: 1.5,
    },
  },
  loadNewAccount: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    load_new_account: {
      p75: { warn: 800, fail: 1200 },
      p95: { warn: 1200, fail: 1800 },
      ciMultiplier: 1.5,
    },
  },
});

const validOverride: ThresholdOverrideFile = {
  overrides: [
    {
      benchmark: 'startupStandardHome',
      metric: 'uiStartup',
      percentile: 'p75',
      warn: 2800,
      fail: 3500,
      justification: 'Adding new dashboard feature increases startup time',
    },
  ],
};

describe('threshold-overrides', () => {
  describe('validateOverrides', () => {
    it('accepts a valid override file', () => {
      const result = validateOverrides(validOverride);
      expect(result.overrides).toHaveLength(1);
      expect(result.overrides[0].benchmark).toBe('startupStandardHome');
    });

    it('accepts overrides with only warn specified', () => {
      const file = {
        overrides: [
          {
            benchmark: 'startupStandardHome',
            metric: 'uiStartup',
            percentile: 'p75',
            warn: 2800,
            justification: 'Raising warn only',
          },
        ],
      };
      const result = validateOverrides(file);
      expect(result.overrides[0].warn).toBe(2800);
      expect(result.overrides[0].fail).toBeUndefined();
    });

    it('accepts overrides with only fail specified', () => {
      const file = {
        overrides: [
          {
            benchmark: 'startupStandardHome',
            metric: 'uiStartup',
            percentile: 'p95',
            fail: 5000,
            justification: 'Raising fail only',
          },
        ],
      };
      const result = validateOverrides(file);
      expect(result.overrides[0].fail).toBe(5000);
    });

    it('rejects non-object input', () => {
      expect(() => validateOverrides(null)).toThrow(
        'Override file must be a JSON object',
      );
      expect(() => validateOverrides('string')).toThrow(
        'Override file must be a JSON object',
      );
    });

    it('rejects missing overrides array', () => {
      expect(() => validateOverrides({})).toThrow(
        'must contain an "overrides" array',
      );
    });

    it('rejects empty benchmark name', () => {
      expect(() =>
        validateOverrides({
          overrides: [
            {
              benchmark: '',
              metric: 'uiStartup',
              percentile: 'p75',
              warn: 2800,
              justification: 'test',
            },
          ],
        }),
      ).toThrow('overrides[0]: "benchmark" must be a non-empty string');
    });

    it('rejects empty metric name', () => {
      expect(() =>
        validateOverrides({
          overrides: [
            {
              benchmark: 'startupStandardHome',
              metric: '',
              percentile: 'p75',
              warn: 2800,
              justification: 'test',
            },
          ],
        }),
      ).toThrow('overrides[0]: "metric" must be a non-empty string');
    });

    it('rejects invalid percentile', () => {
      expect(() =>
        validateOverrides({
          overrides: [
            {
              benchmark: 'startupStandardHome',
              metric: 'uiStartup',
              percentile: 'p50',
              warn: 2800,
              justification: 'test',
            },
          ],
        }),
      ).toThrow('"percentile" must be "p75" or "p95"');
    });

    it('rejects when neither warn nor fail is specified', () => {
      expect(() =>
        validateOverrides({
          overrides: [
            {
              benchmark: 'startupStandardHome',
              metric: 'uiStartup',
              percentile: 'p75',
              justification: 'test',
            },
          ],
        }),
      ).toThrow('at least one of "warn" or "fail" must be specified');
    });

    it('rejects negative warn value', () => {
      expect(() =>
        validateOverrides({
          overrides: [
            {
              benchmark: 'startupStandardHome',
              metric: 'uiStartup',
              percentile: 'p75',
              warn: -100,
              justification: 'test',
            },
          ],
        }),
      ).toThrow('"warn" must be a non-negative number');
    });

    it('rejects warn >= fail', () => {
      expect(() =>
        validateOverrides({
          overrides: [
            {
              benchmark: 'startupStandardHome',
              metric: 'uiStartup',
              percentile: 'p75',
              warn: 3000,
              fail: 3000,
              justification: 'test',
            },
          ],
        }),
      ).toThrow('"warn" (3000) must be less than "fail" (3000)');
    });

    it('rejects missing justification', () => {
      expect(() =>
        validateOverrides({
          overrides: [
            {
              benchmark: 'startupStandardHome',
              metric: 'uiStartup',
              percentile: 'p75',
              warn: 2800,
              justification: '',
            },
          ],
        }),
      ).toThrow('"justification" must be a non-empty string');
    });

    it('accepts a valid ISO expires date', () => {
      const result = validateOverrides({
        overrides: [
          {
            benchmark: 'startupStandardHome',
            metric: 'uiStartup',
            percentile: 'p75',
            warn: 2800,
            justification: 'test',
            expires: '2099-01-01',
          },
        ],
      });
      expect(result.overrides[0].expires).toBe('2099-01-01');
    });

    it('rejects a malformed expires date', () => {
      expect(() =>
        validateOverrides({
          overrides: [
            {
              benchmark: 'startupStandardHome',
              metric: 'uiStartup',
              percentile: 'p75',
              warn: 2800,
              justification: 'test',
              expires: '01-01-2099',
            },
          ],
        }),
      ).toThrow('"expires" must be an ISO date string (YYYY-MM-DD)');
    });

    it('validates multiple entries and reports the first error', () => {
      expect(() =>
        validateOverrides({
          overrides: [
            {
              benchmark: 'startupStandardHome',
              metric: 'uiStartup',
              percentile: 'p75',
              warn: 2800,
              justification: 'valid',
            },
            {
              benchmark: '',
              metric: 'uiStartup',
              percentile: 'p75',
              warn: 2800,
              justification: 'invalid',
            },
          ],
        }),
      ).toThrow('overrides[1]:');
    });
  });

  describe('loadOverrides', () => {
    it('returns null when the file does not exist', async () => {
      const result = await loadOverrides('/nonexistent/path');
      expect(result).toBeNull();
    });

    it('loads and validates a valid override file', async () => {
      const tmpDir = path.join(FIXTURES_DIR, 'valid-overrides');
      await fs.mkdir(tmpDir, { recursive: true });
      await fs.writeFile(
        path.join(tmpDir, '.threshold-overrides.json'),
        JSON.stringify(validOverride),
      );

      try {
        const result = await loadOverrides(tmpDir);
        expect(result).not.toBeNull();
        expect(result?.overrides).toHaveLength(1);
      } finally {
        await fs.rm(tmpDir, { recursive: true });
      }
    });

    it('throws on invalid JSON', async () => {
      const tmpDir = path.join(FIXTURES_DIR, 'invalid-json');
      await fs.mkdir(tmpDir, { recursive: true });
      await fs.writeFile(
        path.join(tmpDir, '.threshold-overrides.json'),
        'not json{{{',
      );

      try {
        await expect(loadOverrides(tmpDir)).rejects.toThrow('invalid JSON');
      } finally {
        await fs.rm(tmpDir, { recursive: true });
      }
    });

    it('throws on invalid override structure', async () => {
      const tmpDir = path.join(FIXTURES_DIR, 'invalid-structure');
      await fs.mkdir(tmpDir, { recursive: true });
      await fs.writeFile(
        path.join(tmpDir, '.threshold-overrides.json'),
        JSON.stringify({ overrides: [{ benchmark: '' }] }),
      );

      try {
        await expect(loadOverrides(tmpDir)).rejects.toThrow(
          '"benchmark" must be a non-empty string',
        );
      } finally {
        await fs.rm(tmpDir, { recursive: true });
      }
    });

    it('supports a custom filename', async () => {
      const tmpDir = path.join(FIXTURES_DIR, 'custom-filename');
      await fs.mkdir(tmpDir, { recursive: true });
      await fs.writeFile(
        path.join(tmpDir, 'custom.json'),
        JSON.stringify(validOverride),
      );

      try {
        const result = await loadOverrides(tmpDir, 'custom.json');
        expect(result).not.toBeNull();
      } finally {
        await fs.rm(tmpDir, { recursive: true });
      }
    });
  });

  describe('applyOverrides', () => {
    it('applies a p75 override to existing thresholds', () => {
      const registry = makeRegistry();
      const { effectiveRegistry, applied } = applyOverrides(
        registry,
        validOverride,
      );

      expect(applied).toHaveLength(1);
      expect(applied[0].previousWarn).toBe(2000);
      expect(applied[0].previousFail).toBe(2500);

      expect(effectiveRegistry.startupStandardHome.uiStartup.p75).toStrictEqual(
        { warn: 2800, fail: 3500 },
      );
      // p95 should be unchanged
      expect(effectiveRegistry.startupStandardHome.uiStartup.p95).toStrictEqual(
        { warn: 2500, fail: 3200 },
      );
    });

    it('applies warn-only override (keeps existing fail)', () => {
      const registry = makeRegistry();
      const overrides: ThresholdOverrideFile = {
        overrides: [
          {
            benchmark: 'startupStandardHome',
            metric: 'uiStartup',
            percentile: 'p75',
            warn: 2800,
            justification: 'test',
          },
        ],
      };

      const { effectiveRegistry, applied } = applyOverrides(
        registry,
        overrides,
      );

      expect(applied).toHaveLength(1);
      expect(effectiveRegistry.startupStandardHome.uiStartup.p75).toStrictEqual(
        { warn: 2800, fail: 2500 },
      );
    });

    it('applies fail-only override (keeps existing warn)', () => {
      const registry = makeRegistry();
      const overrides: ThresholdOverrideFile = {
        overrides: [
          {
            benchmark: 'startupStandardHome',
            metric: 'uiStartup',
            percentile: 'p95',
            fail: 5000,
            justification: 'test',
          },
        ],
      };

      const { effectiveRegistry } = applyOverrides(registry, overrides);
      expect(effectiveRegistry.startupStandardHome.uiStartup.p95).toStrictEqual(
        { warn: 2500, fail: 5000 },
      );
    });

    it('does not mutate the original registry', () => {
      const registry = makeRegistry();
      const { warn: originalWarn } = registry.startupStandardHome.uiStartup
        .p75 as { warn: number };

      applyOverrides(registry, validOverride);

      const { warn: afterWarn } = registry.startupStandardHome.uiStartup
        .p75 as { warn: number };
      expect(afterWarn).toBe(originalWarn);
    });

    it('throws on an unknown benchmark', () => {
      const registry = makeRegistry();
      const overrides: ThresholdOverrideFile = {
        overrides: [
          {
            benchmark: 'nonExistentBenchmark',
            metric: 'uiStartup',
            percentile: 'p75',
            warn: 5000,
            justification: 'test',
          },
        ],
      };

      expect(() => applyOverrides(registry, overrides)).toThrow(
        'benchmark "nonExistentBenchmark" not found',
      );
    });

    it('throws on an unknown metric', () => {
      const registry = makeRegistry();
      const overrides: ThresholdOverrideFile = {
        overrides: [
          {
            benchmark: 'startupStandardHome',
            metric: 'nonExistentMetric',
            percentile: 'p75',
            warn: 5000,
            justification: 'test',
          },
        ],
      };

      expect(() => applyOverrides(registry, overrides)).toThrow(
        'metric "nonExistentMetric" not found',
      );
    });

    it('throws when an override has expired', () => {
      const registry = makeRegistry();
      const overrides: ThresholdOverrideFile = {
        overrides: [
          {
            benchmark: 'startupStandardHome',
            metric: 'uiStartup',
            percentile: 'p75',
            fail: 5000,
            justification: 'test',
            expires: '2000-01-01',
          },
        ],
      };

      expect(() => applyOverrides(registry, overrides)).toThrow(
        'expired on 2000-01-01',
      );
    });

    it('applies an override with a future expiry date', () => {
      const registry = makeRegistry();
      const overrides: ThresholdOverrideFile = {
        overrides: [
          {
            benchmark: 'startupStandardHome',
            metric: 'uiStartup',
            percentile: 'p75',
            fail: 5000,
            justification: 'test',
            expires: '2999-12-31',
          },
        ],
      };

      const { applied } = applyOverrides(registry, overrides);
      expect(applied).toHaveLength(1);
      expect(applied[0].expires).toBe('2999-12-31');
    });

    it('applies multiple overrides across benchmarks', () => {
      const registry = makeRegistry();
      const overrides: ThresholdOverrideFile = {
        overrides: [
          {
            benchmark: 'startupStandardHome',
            metric: 'uiStartup',
            percentile: 'p75',
            warn: 2800,
            fail: 3500,
            justification: 'dashboard feature',
          },
          {
            benchmark: 'loadNewAccount',
            metric: 'load_new_account',
            percentile: 'p95',
            fail: 2500,
            justification: 'new account flow redesign',
          },
        ],
      };

      const { effectiveRegistry, applied } = applyOverrides(
        registry,
        overrides,
      );

      expect(applied).toHaveLength(2);
      expect(effectiveRegistry.startupStandardHome.uiStartup.p75).toStrictEqual(
        { warn: 2800, fail: 3500 },
      );
      // eslint-disable-next-line @typescript-eslint/naming-convention
      expect(
        effectiveRegistry.loadNewAccount.load_new_account.p95,
      ).toStrictEqual({ warn: 1200, fail: 2500 });
    });

    it('preserves ciMultiplier', () => {
      const registry = makeRegistry();
      const { effectiveRegistry } = applyOverrides(registry, validOverride);
      expect(effectiveRegistry.startupStandardHome.uiStartup.ciMultiplier).toBe(
        1.5,
      );
    });
  });

  describe('formatOverrideSummary', () => {
    it('returns empty string for no overrides', () => {
      expect(formatOverrideSummary([])).toBe('');
    });

    it('formats a single override', () => {
      const applied: AppliedOverride[] = [
        {
          benchmark: 'startupStandardHome',
          metric: 'uiStartup',
          percentile: 'p75',
          warn: 2800,
          fail: 3500,
          justification: 'Adding dashboard feature',
          previousWarn: 2000,
          previousFail: 2500,
        },
      ];

      const output = formatOverrideSummary(applied);
      expect(output).toContain('Threshold Overrides Active');
      expect(output).toContain('startupStandardHome/uiStartup');
      expect(output).toContain('warn: 2000→2800');
      expect(output).toContain('fail: 2500→3500');
      expect(output).toContain('Adding dashboard feature');
    });

    it('shows "—" for new thresholds without previous values', () => {
      const applied: AppliedOverride[] = [
        {
          benchmark: 'startupStandardHome',
          metric: 'uiStartup',
          percentile: 'p75',
          warn: 2800,
          justification: 'test',
          previousWarn: undefined,
        },
      ];

      const output = formatOverrideSummary(applied);
      expect(output).toContain('warn: —→2800');
    });
  });

  describe('formatOverrideHtml', () => {
    it('returns empty string for no overrides', () => {
      expect(formatOverrideHtml([])).toBe('');
    });

    it('produces a collapsible HTML table', () => {
      const applied: AppliedOverride[] = [
        {
          benchmark: 'startupStandardHome',
          metric: 'uiStartup',
          percentile: 'p75',
          warn: 2800,
          fail: 3500,
          justification: 'Adding dashboard feature',
          previousWarn: 2000,
          previousFail: 2500,
        },
      ];

      const html = formatOverrideHtml(applied);
      expect(html).toContain('<details>');
      expect(html).toContain('Threshold Overrides Active (1)');
      expect(html).toContain('<table>');
      expect(html).toContain('startupStandardHome/uiStartup');
      expect(html).toContain('Adding dashboard feature');
    });
  });
});
