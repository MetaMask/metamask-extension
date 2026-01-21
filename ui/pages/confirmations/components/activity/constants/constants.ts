import type { Hex } from '@metamask/utils';

export const PAY_CURRENCY = 'usd';
export const PAY_MINIMUM_DEPOSIT = 0.01;

export const ARBITRUM_USDC = {
  address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' as Hex,
  decimals: 6,
  name: 'USD Coin',
  symbol: 'USDC',
};

export const POLYGON_USDCE = {
  address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174' as Hex,
  decimals: 6,
  name: 'USD Coin (PoS)',
  symbol: 'USDC.e',
};
