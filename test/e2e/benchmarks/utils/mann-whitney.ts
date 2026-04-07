/**
 * Mann-Whitney U test for comparing two independent samples.
 *
 * Non-parametric alternative to Welch's t — no normality assumption required.
 * Appropriate for benchmark timing data which is typically right-skewed.
 *
 * - Exact p-value via DP enumeration for small samples without ties (n1*n2 <= 400)
 * - Normal approximation with continuity correction and tie correction otherwise
 * - Effect size: rank-biserial r = 1 - 2U/(n1*n2), range [-1, 1]
 *
 * Reference: mann-whitney-u.py in repo root (scipy.stats.mannwhitneyu validation)
 */

export type MannWhitneyResult = {
  /** Whether the regression is statistically significant at the given alpha */
  significant: boolean;
  /** Two-sided p-value */
  pValue: number;
  /** Rank-biserial effect size r: |r|>0.5 large, >0.3 medium, >0.1 small */
  effectSize: number;
  /** Median-based delta: (current - baseline) / baseline */
  deltaPercent: number;
  /** Raw U statistic (min of U1, U2) */
  uStatistic: number;
  /** Whether the exact test was used (vs normal approximation) */
  exact: boolean;
};

/**
 * Standard normal CDF approximation.
 * Zelen & Severo (1964), max error < 7.5e-8.
 *
 * @param x - The value at which to evaluate the CDF.
 */
function normalCDF(x: number): number {
  if (x < -8) {
    return 0;
  }
  if (x > 8) {
    return 1;
  }

  const absX = Math.abs(x);
  const t = 1 / (1 + 0.2316419 * absX);
  const d = 0.3989422804014327; // 1/sqrt(2*pi)
  const pdf = d * Math.exp(-0.5 * x * x);

  const poly =
    t *
    (0.31938153 +
      t *
        (-0.356563782 +
          t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));

  const cdf = 1 - pdf * poly;
  return x >= 0 ? cdf : 1 - cdf;
}

/**
 * Assign ranks to combined samples, handling ties via average ranks.
 *
 * @param combined - The combined array of values from both samples.
 * @returns ranks for each element in the combined array, plus tie group info
 */
function assignRanks(combined: number[]): {
  ranks: number[];
  tieGroups: number[];
} {
  const n = combined.length;
  const indexed = combined.map((val, i) => ({ val, i }));
  indexed.sort((a, b) => a.val - b.val);

  const ranks = new Array<number>(n);
  const tieGroups: number[] = [];

  let i = 0;
  while (i < n) {
    let j = i;
    while (j < n && indexed[j].val === indexed[i].val) {
      j += 1;
    }
    // Positions i..j-1 are tied; assign average rank (1-based)
    const avgRank = (i + 1 + j) / 2;
    const groupSize = j - i;
    if (groupSize > 1) {
      tieGroups.push(groupSize);
    }
    for (let k = i; k < j; k += 1) {
      ranks[indexed[k].i] = avgRank;
    }
    i = j;
  }

  return { ranks, tieGroups };
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Compute exact p-value via DP enumeration of all possible rank sums.
 *
 * Counts the number of subsets of size n1 from {1,...,N} with each
 * possible rank sum, then computes P(U1 <= observed).
 *
 * Only valid when there are no ties (ranks are integers 1..N).
 *
 * @param u1 - Observed U1 statistic
 * @param n1 - Size of sample 1
 * @param n2 - Size of sample 2
 * @returns Two-sided p-value
 */
function exactPValue(u1: number, n1: number, n2: number): number {
  const N = n1 + n2;
  const minRankSum = (n1 * (n1 + 1)) / 2;
  const maxRankSum = n1 * n2 + minRankSum;

  // dp[k][s] = number of k-subsets from {1..N} with raw rank sum = s
  // Array sized to maxRankSum so all valid n1-subset sums fit.
  const dp: Float64Array[] = Array.from(
    { length: n1 + 1 },
    () => new Float64Array(maxRankSum + 1),
  );
  dp[0][0] = 1;

  // 0-1 knapsack over ranks 1..N
  for (let r = 1; r <= N; r += 1) {
    for (let k = Math.min(r, n1); k >= 1; k -= 1) {
      for (let s = maxRankSum; s >= r; s -= 1) {
        dp[k][s] += dp[k - 1][s - r];
      }
    }
  }

  // Total = C(N, n1)
  let total = 0;
  for (let s = minRankSum; s <= maxRankSum; s += 1) {
    total += dp[n1][s];
  }

  if (total === 0) {
    return 1;
  }

  // R1 = U1 + minRankSum — convert U statistic back to raw rank sum
  const r1 = u1 + minRankSum;
  let leftTail = 0;
  for (let s = 0; s <= r1; s += 1) {
    leftTail += dp[n1][s];
  }

  // Two-sided: p = 2 * min(P(U1 <= u1), P(U1 >= u1))
  const pLeft = leftTail / total;
  const pRight = 1 - (leftTail - dp[n1][r1]) / total;
  const pTwoSided = 2 * Math.min(pLeft, pRight);

  return Math.min(pTwoSided, 1);
}

/**
 * Compute p-value using normal approximation with continuity correction
 * and tie correction in the variance.
 *
 * @param u - min(U1, U2)
 * @param n1 - Size of sample 1
 * @param n2 - Size of sample 2
 * @param tieGroups - Array of tie group sizes (groups with >1 tied value)
 * @returns Two-sided p-value
 */
function normalApproxPValue(
  u: number,
  n1: number,
  n2: number,
  tieGroups: number[],
): number {
  const N = n1 + n2;
  const meanU = (n1 * n2) / 2;

  // Base variance
  let variance = (n1 * n2 * (N + 1)) / 12;

  // Tie correction: subtract n1*n2*sum(t^3-t) / (12*N*(N-1))
  if (tieGroups.length > 0 && N > 1) {
    let tieCorrection = 0;
    for (const t of tieGroups) {
      tieCorrection += t * t * t - t;
    }
    variance -= (n1 * n2 * tieCorrection) / (12 * N * (N - 1));
  }

  if (variance <= 0) {
    return 1;
  }

  // Continuity correction: shift U 0.5 toward the mean
  const z = (Math.abs(u - meanU) - 0.5) / Math.sqrt(variance);

  // Two-sided p-value
  return 2 * (1 - normalCDF(Math.abs(z)));
}

/**
 * Run a Mann-Whitney U test comparing two independent samples.
 *
 * @param current - Current benchmark per-run samples (treatment group)
 * @param baseline - Historical per-run samples (control group)
 * @param alpha - Significance level (default 0.05)
 * @returns Test results including significance, p-value, effect size, delta %
 */
export function mannWhitneyU(
  current: number[],
  baseline: number[],
  alpha: number = 0.05,
): MannWhitneyResult {
  const n1 = current.length;
  const n2 = baseline.length;

  if (n1 < 2 || n2 < 2) {
    return {
      significant: false,
      pValue: 1,
      effectSize: 0,
      deltaPercent: 0,
      uStatistic: 0,
      exact: false,
    };
  }

  // Combine and rank
  const combined = [...current, ...baseline];
  const { ranks, tieGroups } = assignRanks(combined);

  // Rank sum for sample 1 (current)
  let R1 = 0;
  for (let i = 0; i < n1; i += 1) {
    R1 += ranks[i];
  }

  const U1 = R1 - (n1 * (n1 + 1)) / 2;
  const U2 = n1 * n2 - U1;
  const U = Math.min(U1, U2);

  // Effect size: rank-biserial r
  const effectSize = 1 - (2 * U) / (n1 * n2);

  // Median-based delta
  const medCurrent = median(current);
  const medBaseline = median(baseline);
  const deltaPercent =
    medBaseline === 0 ? 0 : (medCurrent - medBaseline) / medBaseline;

  // p-value: exact for small samples without ties, normal approx otherwise
  let pValue: number;
  let exact: boolean;

  if (tieGroups.length === 0 && n1 * n2 <= 400) {
    pValue = exactPValue(U1, n1, n2);
    exact = true;
  } else {
    pValue = normalApproxPValue(U, n1, n2, tieGroups);
    exact = false;
  }

  return {
    significant: pValue < alpha,
    pValue,
    effectSize,
    deltaPercent,
    uStatistic: U,
    exact,
  };
}

export type StatisticalVerdict = 'fail' | 'warn' | 'pass';

export type StatisticalTestResult = {
  metric: string;
  pValue: number;
  effectSize: number;
  significant: boolean;
  deltaPercent: number;
  verdict: StatisticalVerdict;
};

/**
 * Determine if a regression is statistically significant and classify severity.
 *
 * Verdict logic:
 * - fail: significant (p < alpha) AND > 10% slower
 * - warn: significant AND 5-10% slower
 * - pass: not significant, or < 5% slower, or faster
 *
 * @param metric - Metric identifier (e.g. timer step name)
 * @param current - Current per-run samples
 * @param baseline - Baseline per-run samples
 * @param alpha - Significance level (default 0.05)
 */
export function isSignificantRegression(
  metric: string,
  current: number[],
  baseline: number[],
  alpha: number = 0.05,
): StatisticalTestResult {
  const result = mannWhitneyU(current, baseline, alpha);

  let verdict: StatisticalVerdict = 'pass';
  if (result.significant && result.deltaPercent > 0) {
    if (result.deltaPercent >= 0.1) {
      verdict = 'fail';
    } else if (result.deltaPercent >= 0.05) {
      verdict = 'warn';
    }
  }

  return {
    metric,
    pValue: result.pValue,
    effectSize: result.effectSize,
    significant: result.significant,
    deltaPercent: result.deltaPercent,
    verdict,
  };
}
