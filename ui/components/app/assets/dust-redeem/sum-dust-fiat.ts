import type { TokenWithFiatAmount } from '../types';

/**
 * Stable identity for a token row in the dust redeem modal.
 *
 * @param token - Token to identify.
 * @returns A key unique to the token's chain and address.
 */
export function getDustTokenKey(
  token: Pick<TokenWithFiatAmount, 'chainId' | 'address'>,
): string {
  return `${token.chainId}:${token.address.toLowerCase()}`;
}

/**
 * Sums the fiat value of tokens, skipping amounts that are not finite.
 *
 * @param tokens - Tokens to total.
 * @returns The combined fiat amount.
 */
export function sumDustFiatAmount(tokens: TokenWithFiatAmount[]): number {
  return tokens.reduce((total, token) => {
    const amount = token.tokenFiatAmount;
    return typeof amount === 'number' && Number.isFinite(amount)
      ? total + amount
      : total;
  }, 0);
}
