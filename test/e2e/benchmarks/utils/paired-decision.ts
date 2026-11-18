/**
 * ADR 0072's paired decision rule: the Hodges-Lehmann shift of per-run
 * head-minus-base differences, its exact one-sided Wilcoxon signed-rank lower
 * bound (no tie correction), and a verdict against the series' `δ_block`.
 */

/** A rational level, so the comparison against the null counts stays exact. */
export type Alpha = {
  readonly numerator: bigint;
  readonly denominator: bigint;
};

/** ADR 0072's alpha*, 5%. The scorer reads the float 0.05 as exactly 1/20. */
export const ALPHA: Alpha = { numerator: 1n, denominator: 20n };

/**
 * `block`: the lower bound exceeds `δ_block`. `no-block`: a bound exists and
 * does not exceed it. `unable`: too few differences for a bound at alpha*,
 * which neither blocks nor passes.
 */
export type PairedVerdict = 'block' | 'no-block' | 'unable';

export type PairedDecision = {
  /** Number of differences. */
  n: number;
  /** One-sample Hodges-Lehmann shift; `null` only when there are no differences. */
  shift: number | null;
  /** Signed-rank one-sided lower bound; `null` when `verdict` is `unable`. */
  lower: number | null;
  /** 1-based index of the lower bound among the sorted Walsh averages; 0 when `unable`. */
  k: number;
  /** The level the bound attains, `P(T+ <= k - 1)`; `null` when `unable`. */
  attainedLevel: number | null;
  verdict: PairedVerdict;
};

const nullCounts = new Map<number, readonly bigint[]>();

/** `[number of subsets of {1..n} with sum t]` for `t` in `0..n(n + 1) / 2`: the null distribution of `T+` times 2^n. */
export function signedRankCounts(n: number): readonly bigint[] {
  const cached = nullCounts.get(n);
  if (cached) {
    return cached;
  }
  let counts: bigint[] = [1n];
  for (let rank = 1; rank <= n; rank++) {
    const next = new Array<bigint>(counts.length + rank).fill(0n);
    counts.forEach((count, sum) => {
      next[sum] += count;
      next[sum + rank] += count;
    });
    counts = next;
  }
  nullCounts.set(n, counts);
  return counts;
}

/** Largest `k` with `P(T+ <= k - 1) <= alpha`, and that level (`k` 0 when `2^-n > alpha`). */
export function lowerRank(
  n: number,
  alpha: Alpha = ALPHA,
): { k: number; attained: readonly [bigint, bigint] | null } {
  const total = 2n ** BigInt(n);
  if (n < 1 || alpha.denominator > alpha.numerator * total) {
    return { k: 0, attained: null };
  }
  let cumulative = 0n;
  let k = 0;
  for (const [sum, count] of signedRankCounts(n).entries()) {
    if ((cumulative + count) * alpha.denominator > alpha.numerator * total) {
      break;
    }
    cumulative += count;
    k = sum + 1;
  }
  return { k, attained: [cumulative, total] };
}

/**
 * The sorted Walsh averages `(d_i + d_j) / 2`, `i <= j`.
 *
 * @param differences - The paired differences.
 */
export function walshAverages(differences: readonly number[]): number[] {
  const averages: number[] = [];
  differences.forEach((first, i) => {
    for (const second of differences.slice(i)) {
      averages.push((first + second) / 2);
    }
  });
  return averages.sort((a, b) => a - b);
}

function medianOfSorted(sorted: readonly number[]): number {
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

/** Decide one series from its paired differences. */
export function decidePaired(
  differences: readonly number[],
  deltaBlock: number,
  alpha: Alpha = ALPHA,
): PairedDecision {
  if (!differences.every(Number.isFinite) || !Number.isFinite(deltaBlock)) {
    throw new RangeError('decidePaired takes finite differences and delta');
  }
  const n = differences.length;
  const walsh = walshAverages(differences);
  const shift = n === 0 ? null : medianOfSorted(walsh);
  const { k, attained } = lowerRank(n, alpha);
  if (!attained) {
    return {
      n,
      shift,
      lower: null,
      k: 0,
      attainedLevel: null,
      verdict: 'unable',
    };
  }
  const lower = walsh[k - 1];
  return {
    n,
    shift,
    lower,
    k,
    attainedLevel: Number(attained[0]) / Number(attained[1]),
    verdict: lower > deltaBlock ? 'block' : 'no-block',
  };
}
