/**
 * Helper function to test whether an amount (with or without currency symbols) is equal to zero.
 *
 * @param amount - The amount to test.
 * @returns true if the amount is undefined, null, an empty string, or zero-like; false otherwise.
 * @example
 * ``` typescript
 * isZeroAmount(null)        // true
 * isZeroAmount(undefined)   // true
 * isZeroAmount('')          // true
 * isZeroAmount('0')         // true
 * isZeroAmount('0.00')      // true
 * isZeroAmount('$0.00')     // true
 * isZeroAmount('$1.00')     // false
 * isZeroAmount(0)           // true
 * isZeroAmount(1)           // false
 * ```
 */
export function isZeroAmount(
  amount: string | number | null | undefined,
): boolean {
  if (amount === null || amount === undefined) {
    return true;
  }

  if (typeof amount === 'number') {
    return amount === 0;
  }

  const onlyNumbers = amount.replace(/\D+/gu, '').trim();
  return /^0*$/u.test(onlyNumbers);
}
