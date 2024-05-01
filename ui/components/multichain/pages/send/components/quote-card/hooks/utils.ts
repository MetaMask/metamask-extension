const MAX_TOKEN_DECIMALS = 7;
const TRAILING_ZEROS = /0+$/u;

export const toFixedNoTrailingZeros = (
  value: number,
  decimals = MAX_TOKEN_DECIMALS,
) => value.toFixed(decimals).replace(TRAILING_ZEROS, '');
