import {
  BUYABLE_CHAINS_MAP,
  CHAIN_IDS,
} from '../../../shared/constants/network';

export const formatMoonpaySymbol = (
  symbol: string | null,
  chainId: keyof typeof BUYABLE_CHAINS_MAP,
): string | null => {
  if (!symbol) {
    return symbol;
  }
  let _symbol = symbol;
  if (chainId === CHAIN_IDS.POLYGON || chainId === CHAIN_IDS.BSC) {
    _symbol = `${_symbol}_${BUYABLE_CHAINS_MAP?.[
      chainId
    ]?.network.toUpperCase()}`;
  } else if (chainId === CHAIN_IDS.AVALANCHE) {
    _symbol = `${_symbol}_CCHAIN`;
  }
  return _symbol;
};
