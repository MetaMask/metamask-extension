const PERPS_WITHDRAW_AMOUNT_DECIMALS = 6;

/**
 * Drops trailing fractional zeros and the decimal point when the fraction is empty.
 * Linear in string length; `toFixed` output is bounded by decimal count (no regex).
 * @param formatted
 */
export function stripInsignificantFractionZeros(formatted: string): string {
  const dotIndex = formatted.indexOf('.');
  if (dotIndex === -1) {
    return formatted;
  }
  let end = formatted.length - 1;
  while (end > dotIndex && formatted[end] === '0') {
    end -= 1;
  }
  if (end === dotIndex) {
    return formatted.slice(0, dotIndex);
  }
  return formatted.slice(0, end + 1);
}

export function formatAmountInputFromNumber(n: number): string {
  if (!Number.isFinite(n) || n <= 0) {
    return '';
  }
  const factor = 10 ** PERPS_WITHDRAW_AMOUNT_DECIMALS;
  const floored = Math.floor(n * factor) / factor;
  if (floored === Math.floor(floored)) {
    return String(Math.floor(floored));
  }
  return stripInsignificantFractionZeros(
    floored.toFixed(PERPS_WITHDRAW_AMOUNT_DECIMALS),
  );
}
