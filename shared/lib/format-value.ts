export const isValidAmount = (amount: number | null | undefined): boolean =>
  amount !== null && amount !== undefined && !Number.isNaN(amount);

export function formatValue(
  value: number | null | undefined,
  includeParentheses: boolean,
): string {
  if (!isValidAmount(value)) {
    return '';
  }

  const numericValue = value as number;
  const sign = numericValue >= 0 ? '+' : '';
  const formattedNumber = `${sign}${numericValue.toFixed(2)}%`;

  return includeParentheses ? `(${formattedNumber})` : formattedNumber;
}
