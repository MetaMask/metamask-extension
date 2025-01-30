const MAX_TOKEN_DECIMALS = 7;
const TRAILING_ZEROS = /0+$/u;

export const toFixedNoTrailingZeros = (
  value: number,
  decimals = MAX_TOKEN_DECIMALS,
) => {
  const valueWithNoTrailingZeros = value
    .toFixed(decimals)
    .replace(TRAILING_ZEROS, '');

  return valueWithNoTrailingZeros.endsWith('.')
    ? valueWithNoTrailingZeros.slice(0, -1)
    : valueWithNoTrailingZeros;
};
