import type { CoverageStatus } from '@metamask/shield-controller';
import {
  CoverageMetrics,
  getCoverageMetrics,
  getCoverageStatus,
  ShieldState,
} from './coverage';

describe('shield coverage selectors', () => {
  const confirmationId = 'abc123';

  const createStateWithResult = (result: {
    status?: CoverageStatus;
    reasonCode?: string;
    metrics?: { latency?: number };
  }): ShieldState =>
    ({
      metamask: {
        coverageResults: {
          [confirmationId]: {
            results: [result],
          },
        },
      },
    }) as unknown as ShieldState;

  describe('getCoverageStatus', () => {
    it('returns undefined when there are no coverage results', () => {
      const state = {
        metamask: {
          coverageResults: {},
        },
      } as unknown as ShieldState;

      const result = getCoverageStatus(state, confirmationId);
      expect(result).toEqual({ status: undefined, reasonCode: undefined });
    });

    it('returns undefined when results array is empty', () => {
      const state = {
        metamask: {
          coverageResults: {
            [confirmationId]: { results: [] },
          },
        },
      } as unknown as ShieldState;

      const result = getCoverageStatus(state, confirmationId);
      expect(result).toEqual({ status: undefined, reasonCode: undefined });
    });

    it('returns status and reasonCode from the first result', () => {
      const status: CoverageStatus = 'covered';
      const reasonCode = 'ok';
      const state = {
        metamask: {
          coverageResults: {
            [confirmationId]: {
              results: [
                {
                  status,
                  reasonCode,
                },
                { status: 'other', reasonCode: 'ignored' },
              ],
            },
          },
        },
      } as unknown as ShieldState;

      const result = getCoverageStatus(state, confirmationId);
      expect(result.status).toBe(status);
      expect(result.reasonCode).toBe(reasonCode);
    });
  });

  describe('getCoverageMetrics', () => {
    it('returns undefined when there are no coverage results', () => {
      const state = {
        metamask: {
          coverageResults: {},
        },
      } as unknown as ShieldState;

      const result = getCoverageMetrics(state, confirmationId);
      expect(result).toBeUndefined();
    });

    const metricsTestCases = [
      {
        description: 'metrics with latency',
        metrics: { latency: 123 },
        expectedLatency: 123,
      },
      {
        description: 'metrics with latency value of 0',
        metrics: { latency: 0 },
        expectedLatency: 0,
      },
      {
        description: 'empty metrics object',
        metrics: {},
        expectedLatency: undefined,
      },
      {
        description: 'large latency values',
        metrics: { latency: 999999 },
        expectedLatency: 999999,
      },
    ];
    // @ts-expect-error This function is missing from the Mocha type definitions
    it.each(metricsTestCases)(
      'returns $description',
      ({
        metrics,
        expectedLatency,
      }: {
        metrics: CoverageMetrics;
        expectedLatency?: number;
      }) => {
        const state = createStateWithResult({
          status: 'covered',
          metrics,
        });

        const result = getCoverageMetrics(state, confirmationId);

        expect(result).toEqual(metrics);
        expect(result?.latency).toBe(expectedLatency);
      },
    );

    it('returns undefined when metrics property is missing', () => {
      const state = createStateWithResult({
        status: 'covered',
        reasonCode: 'ok',
      });

      const result = getCoverageMetrics(state, confirmationId);

      expect(result).toBeUndefined();
    });

    it('returns metrics from the first result only', () => {
      const metrics = { latency: 123 };
      const state = {
        metamask: {
          coverageResults: {
            [confirmationId]: {
              results: [
                {
                  status: 'covered',
                  reasonCode: 'ok',
                  metrics,
                },
                {
                  status: 'unknown',
                  metrics: { latency: 456 },
                },
              ],
            },
          },
        },
      } as unknown as ShieldState;

      const result = getCoverageMetrics(state, confirmationId);

      expect(result).toEqual(metrics);
      expect(result?.latency).toBe(123);
    });
  });
});
