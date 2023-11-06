import { CHAIN_IDS } from '../../../../shared/constants/network';

function isOptimism(chainId: string) {
  return (
    chainId === CHAIN_IDS.OPTIMISM || chainId === CHAIN_IDS.OPTIMISM_TESTNET
  );
}

function isBase(chainId: string) {
  return chainId === CHAIN_IDS.BASE || chainId === CHAIN_IDS.BASE_TESTNET;
}

function isOpbnb(chainId: string) {
  return chainId === CHAIN_IDS.OPBNB || chainId === CHAIN_IDS.OPBNB_TESTNET;
}

export function isScroll(chainId: string) {
  return chainId === CHAIN_IDS.SCROLL || chainId === CHAIN_IDS.SCROLL_SEPOLIA;
}

export function isOpStack(chainId: string) {
  return isOptimism(chainId) || isBase(chainId) || isOpbnb(chainId);
}

export function isMultiLayerFeeNetwork(chainId: string) {
  return isOpStack(chainId) || isScroll(chainId);
}
