import type { Hex } from '@metamask/utils';
import { CHAIN_IDS } from '../../../../shared/constants/network';

export const PREDICT_CURRENCY = 'usd';

export const POLYGON_USDCE = {
  address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174' as Hex,
  decimals: 6,
  name: 'USD Coin (PoS)',
  symbol: 'USDC.e',
  chainId: CHAIN_IDS.POLYGON,
};
