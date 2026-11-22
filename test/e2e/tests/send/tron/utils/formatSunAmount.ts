/**
 * Formats an amount in sun as a TRX display string, trimming trailing zeros
 * the same way the homepage does (e.g. 5072000 -> '5.072').
 *
 * @param amountInSun - The amount in sun (1 TRX = 1_000_000 sun).
 * @returns The formatted TRX amount string.
 */
export function formatSunAmount(amountInSun: number): string {
  const whole = Math.floor(amountInSun / 1_000_000);
  const fraction = String(amountInSun % 1_000_000).padStart(6, '0');
  return `${whole}.${fraction}`.replace(/\.?0+$/u, '');
}
