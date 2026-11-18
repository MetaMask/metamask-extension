import {
  ALPHA,
  decidePaired,
  lowerRank,
  signedRankCounts,
  walshAverages,
} from './paired-decision';
import parityRows from './fixtures/paired-decision-parity.json';

const format = (value: number | null) =>
  value === null ? '' : value.toFixed(3);

describe('signedRankCounts', () => {
  it('equals the subset-sum counts of {1..n} for n up to 10', () => {
    for (let n = 0; n <= 10; n++) {
      // Enumerate every subset's sum, doubling the list once per rank.
      let sums = [0];
      for (let rank = 1; rank <= n; rank++) {
        sums = sums.flatMap((sum) => [sum, sum + rank]);
      }
      const brute = new Array<bigint>((n * (n + 1)) / 2 + 1).fill(0n);
      for (const sum of sums) {
        brute[sum] += 1n;
      }
      expect(signedRankCounts(n)).toStrictEqual(brute);
    }
  });
});

describe('lowerRank', () => {
  it('takes the 6th of 36 Walsh averages at n = 8, at level 10/256', () => {
    expect(lowerRank(8)).toStrictEqual({ k: 6, attained: [10n, 256n] });
  });

  it('has no bound below n = 5 and k = 1 at n = 5', () => {
    for (const n of [0, 1, 2, 3, 4]) {
      expect(lowerRank(n)).toStrictEqual({ k: 0, attained: null });
    }
    expect(lowerRank(5)).toStrictEqual({ k: 1, attained: [1n, 32n] });
  });

  it('uses the exact comparison at the edge of the level', () => {
    // P(T+ <= 5) = 10/256 is under 1/20 and P(T+ <= 6) = 14/256 is over it;
    // at alpha = 14/256 the 7th is the largest k that fits.
    expect(lowerRank(8, { numerator: 14n, denominator: 256n }).k).toBe(7);
  });
});

describe('walshAverages', () => {
  it('returns the n(n + 1) / 2 averages, sorted', () => {
    expect(walshAverages([4, 0, 2])).toStrictEqual([0, 1, 2, 2, 3, 4]);
  });
});

describe('decidePaired', () => {
  it('blocks when the lower bound exceeds delta and not when it equals it', () => {
    const differences = [10, 11, 12, 13, 14, 15, 16, 17];
    const { lower } = decidePaired(differences, 0);
    expect(lower).toBe(11.5);
    expect(decidePaired(differences, 11.4).verdict).toBe('block');
    expect(decidePaired(differences, 11.5).verdict).toBe('no-block');
  });

  it('is unable, with the shift still reported, below five differences', () => {
    expect(decidePaired([1, 2, 3, 4], 0)).toStrictEqual({
      n: 4,
      shift: 2.5,
      lower: null,
      k: 0,
      attainedLevel: null,
      verdict: 'unable',
    });
  });

  it('reports no shift for no differences', () => {
    expect(decidePaired([], 33)).toMatchObject({
      n: 0,
      shift: null,
      verdict: 'unable',
    });
  });

  it('rejects non-finite input', () => {
    expect(() => decidePaired([1, Number.NaN], 33)).toThrow(RangeError);
    expect(() => decidePaired([1, 2], Number.POSITIVE_INFINITY)).toThrow(
      RangeError,
    );
  });

  it('uses the ADR level by default', () => {
    expect(decidePaired([1, 2, 3, 4, 5, 6, 7, 8], 0).attainedLevel).toBe(
      10 / 256,
    );
    expect(ALPHA).toStrictEqual({ numerator: 1n, denominator: 20n });
  });
});

// Each fixture row holds the differences the admission scorer judged, its
// printed result (`expected`, three decimals) and full-precision values (`exact`).
describe('decidePaired parity with the admission scorer', () => {
  const expectedVerdict = { BLOCK: 'block', '-': 'no-block' } as const;

  it('covers blocking and non-blocking results of both arm types', () => {
    const kinds = new Set(
      parityRows.map((row) => `${row.arm}:${row.expected.result}`),
    );
    expect(parityRows.length).toBeGreaterThanOrEqual(30);
    expect([...kinds].sort()).toStrictEqual([
      'pa:-',
      'pk:-',
      'pk:BLOCK',
      'pn:-',
    ]);
  });

  for (const row of parityRows) {
    it(`${row.series} ${row.arm} ${row.leg} #${row.index} matches the scorer`, () => {
      const decision = decidePaired(row.differences, Number(row.deltaBlock));
      expect(format(decision.shift)).toBe(row.expected.shift);
      expect(format(decision.lower)).toBe(row.expected.lower);
      expect(decision.k).toBe(row.expected.k);
      expect(decision.verdict).toBe(
        expectedVerdict[row.expected.result as keyof typeof expectedVerdict],
      );
      expect(decision.shift).toBe(row.exact.shift);
      expect(decision.lower).toBe(row.exact.lower);
    });
  }
});
