/**
 * Formats price impact percentage for display.
 *
 * @param priceImpact - The price impact value from the API (in decimal form, e.g., 0.87 = 87%).
 * @returns Formatted price impact string.
 */
export function formatPriceImpact(
  priceImpact: string | number | undefined,
): string {
  if (priceImpact === undefined || priceImpact === null) {
    return '0%';
  }

  const impact = Number(priceImpact);

  // If the impact is 0, show 0%
  if (impact === 0) {
    return '0%';
  }

  // Convert from decimal to percentage (0.87 -> 87)
  const percentageImpact = impact * 100;

  // If the impact is very small but not zero, show <0.01%
  if (percentageImpact > 0 && percentageImpact < 0.01) {
    return '<0.01%';
  }

  // If the impact is negative and very small, show <-0.01%
  if (percentageImpact < 0 && percentageImpact > -0.01) {
    return '<-0.01%';
  }

  // For values less than 1%, show with 2 decimal places
  if (Math.abs(percentageImpact) < 1) {
    return `${percentageImpact.toFixed(2)}%`;
  }

  // For values between 1% and 10%, show with 1 decimal place
  if (Math.abs(percentageImpact) < 10) {
    return `${percentageImpact.toFixed(1)}%`;
  }

  // For values 10% and above, show with no decimal places
  return `${Math.round(percentageImpact)}%`;
}
