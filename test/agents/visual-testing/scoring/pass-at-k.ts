/**
 * Unbiased pass@k estimator from the Codex paper (Chen et al., 2021).
 *
 * Computes the probability that at least one of k samples passes,
 * given n total samples with c correct (passing) results.
 *
 * Uses the combinatorial identity to avoid floating-point overflow:
 *   pass@k = 1 - C(n-c, k) / C(n, k)
 *          = 1 - ∏_{i=n-c+1}^{n} (1 - k/i)   (when n-c >= k)
 *
 * @param n - Total number of samples (trials)
 * @param c - Number of correct (passing) samples
 * @param k - Number of draws (attempts allowed)
 * @returns Estimated pass@k probability in [0, 1]
 */
export function passAtK(n: number, c: number, k: number): number {
  if (n <= 0 || k <= 0) {
    return 0;
  }

  if (c >= n || n - c < k) {
    return 1.0;
  }

  let result = 1.0;
  for (let i = n - c + 1; i <= n; i++) {
    result *= 1.0 - k / i;
  }

  return 1.0 - result;
}
