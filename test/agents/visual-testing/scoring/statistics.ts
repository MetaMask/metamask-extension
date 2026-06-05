/**
 * Statistical utilities for eval benchmark reporting.
 *
 * Wilson score interval is used instead of CLT-based intervals because
 * CLT fails below ~100 datapoints. Wilson is valid at any n.
 *
 * @see arXiv:2602.07150 — SWE-bench variance paper
 */

/**
 * Confidence interval bounds.
 */
export type ConfidenceInterval = {
  lower: number;
  upper: number;
};

/**
 * Wilson score interval for a binary success rate.
 *
 * Accurate at any sample size (unlike CLT-based `mean ± 1.96 * std / sqrt(n)`
 * which fails below ~100 datapoints).
 *
 * @param successes - Number of successes
 * @param total - Total number of trials
 * @param z - Z-score for the desired confidence level (default 1.96 = 95%)
 * @returns Lower and upper bounds of the confidence interval
 */
export function wilsonCI(
  successes: number,
  total: number,
  z = 1.96,
): ConfidenceInterval {
  if (total === 0) {
    return { lower: 0, upper: 0 };
  }

  const p = successes / total;
  const zSq = z * z;
  const denom = 1 + zSq / total;
  const center = (p + zSq / (2 * total)) / denom;
  const halfWidth =
    (z / denom) *
    Math.sqrt((p * (1 - p)) / total + zSq / (4 * total * total));

  return {
    lower: Math.max(0, center - halfWidth),
    upper: Math.min(1, center + halfWidth),
  };
}

/**
 * Standard Error of the Mean.
 *
 * @param values - Array of numeric observations
 * @returns SEM, or 0 if fewer than 2 values
 */
export function sem(values: number[]): number {
  if (values.length < 2) {
    return 0;
  }

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (values.length - 1);

  return Math.sqrt(variance) / Math.sqrt(values.length);
}
