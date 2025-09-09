import { mean } from 'lodash';

/**
 * Calculates the standard deviation of an array of numbers.
 * Uses the population standard deviation formula.
 *
 * @param values - Array of numeric values
 * @returns The standard deviation value
 */
export function calculateStandardDeviation(values) {
  if (values.length === 1) {
    return 0;
  }

  const calculatedMean = mean(values);
  const squaredDiffs = values.map((val) => Math.pow(val - calculatedMean, 2));
  const variance = mean(squaredDiffs);
  return Math.sqrt(variance);
}
