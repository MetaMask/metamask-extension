import { CHAIN_IDS } from '../../../../shared/constants/network';

/**
 * @param chainId - chainId to check
 * @returns If chain is Optimism or Optimism Testnet
 */
function isOptimism(chainId: string) {
  return (
    chainId === CHAIN_IDS.OPTIMISM ||
    chainId === CHAIN_IDS.OPTIMISM_TESTNET ||
    chainId === CHAIN_IDS.OPTIMISM_GOERLI
  );
}

/**
 * @param chainId - chainId to check
 * @returns If chain is Base or Base Testnet
 */
function isBase(chainId: string) {
  return chainId === CHAIN_IDS.BASE || chainId === CHAIN_IDS.BASE_TESTNET;
}

/**
 * @param chainId - chainId to check
 * @returns If chain is OPBNB or OPBNB Testnet
 */
function isOpbnb(chainId: string) {
  return chainId === CHAIN_IDS.OPBNB || chainId === CHAIN_IDS.OPBNB_TESTNET;
}

/**
 * @param chainId - chainId to check
 * @returns If chain is Scroll or Scroll Sepolia Testnet
 */
export function isScroll(chainId: string) {
  return chainId === CHAIN_IDS.SCROLL || chainId === CHAIN_IDS.SCROLL_SEPOLIA;
}

/**
 * @param chainId - chainId to check
 * @returns If chain is built on the OPStack
 */
export function isOpStack(chainId: string) {
  return isOptimism(chainId) || isBase(chainId) || isOpbnb(chainId);
}

/**
 * Checks if chain uses a multilayer fee for L1 and L2.
 *
 * @param chainId - chainId to check
 * @returns If chain uses a multilayer fee (by checking if either OpStack or Scroll network)
 */
export function isMultiLayerFeeNetwork(chainId: string) {
  return isOpStack(chainId) || isScroll(chainId);
}
