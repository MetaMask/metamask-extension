// origin: ai-synthesis
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  CUF_FLOW_FILES,
  cufSeries,
  formatCufOutcome,
  loadCufJobs,
  pairDifferences,
  scoreCufs,
  splitSeries,
} from './cufs.mts';
import { resultLabel } from './report.mts';
import type { Decision, JobResult } from './score.mts';
// eslint-disable-next-line import-x/extensions
import { ADMITTED_SERIES } from '../../../test/e2e/benchmarks/utils/admitted-series.ts';

const SEQUENCE = 'ABBABAABAB';

/** One job of `iterations` iterations, base taking `base(i)` ms and head `head(i)`. */
function job(
  metric: string,
  base: (index: number) => number | null,
  head: (index: number) => number | null,
  iterations = SEQUENCE.length,
): JobResult {
  const sessions = Array.from({ length: iterations }, (_, index) => ({
    index,
    build: SEQUENCE[index % SEQUENCE.length] as 'A' | 'B',
    success: true,
  }));
  return {
    sessions,
    samples: {
      [metric]: sessions.map(({ index, build }) =>
        build === 'A' ? base(index) : head(index),
      ) as number[],
    },
  };
}

const noChange: Decision = { ping: 'none', findings: [], unmeasured: [] };
const plan = {
  headSha: 'a'.repeat(40),
  headSubject: 'feat: x',
  baseSha: 'b'.repeat(40),
  canary: false,
  rangeSize: 1,
};

describe('critical user flows', () => {
  it('measures every admitted series outside startup, each flow with a file', () => {
    const outside = ADMITTED_SERIES.filter(
      (entry) => !splitSeries(entry.series).flow.startsWith('startup'),
    );
    expect(cufSeries()).toStrictEqual(outside);
    for (const file of Object.values(CUF_FLOW_FILES)) {
      expect(fs.existsSync(file)).toBe(true);
    }
  });

  it('runs exactly the CUF flows in the cufs job of main-detector.yml', () => {
    const workflow = fs.readFileSync(
      '.github/workflows/main-detector.yml',
      'utf8',
    );
    const matrix = workflow.match(/\n\s+flow:\n((?:\s+- \w+\n)+)/u)?.[1];
    const flows = matrix?.match(/\w+/gu);
    expect(flows).toStrictEqual(Object.keys(CUF_FLOW_FILES));
  });

  describe('pairDifferences', () => {
    it('pairs consecutive iterations as head minus base, whichever ran first', () => {
      const paired = pairDifferences(
        job(
          'step',
          (index) => 100 + index,
          (index) => 110 + index,
        ),
        'step',
      );
      // Pairs (0,1) AB, (2,3) BA, (4,5) BA, (6,7) AB, (8,9) AB.
      expect(paired).toStrictEqual({
        differences: [11, 9, 9, 11, 11],
        dropped: 0,
      });
    });

    it('drops a pair with a failed iteration, a missing value or one build twice', () => {
      const result = job(
        'step',
        () => 100,
        (index) => (index === 2 ? null : 120),
      );
      result.sessions[5].success = false;
      result.sessions[7].build = 'A';

      expect(pairDifferences(result, 'step')).toStrictEqual({
        differences: [20, 20],
        dropped: 3,
      });
    });
  });

  describe('scoreCufs', () => {
    it('blocks a long-task series whose base is 0 ms', () => {
      const result = scoreCufs({
        loadNewAccount: [
          job(
            'load_new_account',
            () => 300,
            () => 300,
          ),
        ],
        bridgeUserActions: [1, 2].map(() =>
          job(
            'longTaskTotalDuration',
            () => 0,
            (index) => 80 + index,
          ),
        ),
      });
      const longTasks = result.outcomes.find(
        (outcome) =>
          outcome.series === 'bridgeUserActions.longTaskTotalDuration',
      );

      expect(longTasks).toMatchObject({ verdict: 'block', jobs: 2 });
      expect(longTasks?.decision?.n).toBe(10);
      expect(result.findings).toStrictEqual([
        'bridgeUserActions.longTaskTotalDuration',
      ]);
      expect(
        result.outcomes.find(
          (outcome) => outcome.series === 'loadNewAccount.load_new_account',
        )?.verdict,
      ).toBe('no-block');
    });

    it('does not block a shift below δ_block', () => {
      const result = scoreCufs({
        loadNewAccount: [
          job(
            'load_new_account',
            () => 300,
            (index) => 320 + (index % 3),
          ),
        ],
      });
      expect(result.findings).toStrictEqual([]);
    });

    it('marks a series with too few pairs or none as could not measure', () => {
      const result = scoreCufs({
        loadNewAccount: [
          job(
            'load_new_account',
            () => 300,
            () => 400,
            4,
          ),
        ],
      });
      const outcome = result.outcomes.find(
        (entry) => entry.series === 'loadNewAccount.load_new_account',
      );

      expect(outcome?.verdict).toBe('unable');
      expect(formatCufOutcome(outcome as never)).toBe(
        '2 pairs from 1 job are too few for a 95% bound',
      );
      expect(result.unmeasured).toContain('loadNewAccount.load_new_account');
      expect(result.unmeasured).toContain(
        'assetDetails.assetClickToPriceChart',
      );
      expect(result.unmeasured).toHaveLength(cufSeries().length);
    });
  });

  it('reads each flow from its own job folders', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'detector-cufs-'));
    try {
      const { sessions, samples } = job(
        'load_new_account',
        () => 300,
        () => 310,
      );
      const folder = path.join(root, 'detector-cuf-loadNewAccount-s2');
      fs.mkdirSync(folder, { recursive: true });
      fs.writeFileSync(
        path.join(folder, 'benchmark-chrome-webpack-loadNewAccount-s2.json'),
        JSON.stringify({ loadNewAccount: { abPilot: { sessions }, samples } }),
      );

      const jobs = loadCufJobs(root, 2);

      expect(jobs.loadNewAccount).toStrictEqual([{ sessions, samples }]);
      expect(jobs.assetDetails).toStrictEqual([]);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('adds slower and unmeasured flows to the result label', () => {
    const cufs = { outcomes: [], findings: ['a.b'], unmeasured: ['c.d'] };

    expect(resultLabel(noChange, plan, cufs)).toBe(
      'critical user flow slower: a.b; could not measure critical user flows: c.d',
    );
    expect(
      resultLabel(noChange, plan, {
        outcomes: [],
        findings: [],
        unmeasured: [],
      }),
    ).toBe('no change detected');
    expect(resultLabel(noChange, plan)).toBe('no change detected');
  });
});
