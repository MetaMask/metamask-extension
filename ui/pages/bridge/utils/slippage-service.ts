import { isSolanaChainId } from '@metamask/bridge-controller';
import type { BridgeToken } from '../../../ducks/bridge/types';
import { STABLECOINS_BY_CHAIN_ID } from './stablecoins';

/**
 * Slippage values for different scenarios
 */
export enum SlippageValue {
  EvmStablecoin = 0.5,
  EvmDefault = 2,
  BridgeDefault = 0.5,
}

/**
 * Context for calculating slippage
 */
export type SlippageContext = {
  fromChain: { chainId: string } | null | undefined;
  toChain: { chainId: string } | null | undefined;
  fromToken: BridgeToken | null;
  toToken: BridgeToken | null;
  isSwap: boolean;
};

/**
 * Checks if a token address is a stablecoin on the given chain
 *
 * @param chainId
 * @param tokenAddress
 */
function isStablecoin(
  chainId: string,
  tokenAddress: string | undefined,
): boolean {
  if (!tokenAddress) {
    return false;
  }

  const stablecoins = STABLECOINS_BY_CHAIN_ID[chainId];
  if (!stablecoins) {
    return false;
  }

  return stablecoins.has(tokenAddress.toLowerCase());
}

/**
 * Checks if both tokens in a pair are stablecoins
 *
 * @param chainId
 * @param fromToken
 * @param toToken
 */
function isStablecoinPair(
  chainId: string,
  fromToken: BridgeToken | null,
  toToken: BridgeToken | null,
): boolean {
  if (!fromToken || !toToken) {
    return false;
  }

  return (
    isStablecoin(chainId, fromToken.address) &&
    isStablecoin(chainId, toToken.address)
  );
}

/**
 * Calculates the appropriate slippage based on the transaction context
 *
 * Rules:
 * - Bridge (cross-chain): Always 0.5%
 * - Swap on Solana: Always undefined (AUTO mode)
 * - Swap on EVM stablecoin pairs (same chain only): 0.5%
 * - Swap on EVM other pairs: 2%
 *
 * @param context
 */
export function calculateSlippage(
  context: SlippageContext,
): number | undefined {
    const { fromChain, toChain, fromToken, toToken, isSwap } = context;

    // If no source chain, we can't determine the type
    if (!fromChain?.chainId || !toChain?.chainId) {
      return SlippageValue.BridgeDefault;
    }

    // 1. Cross-chain (bridge) → 0.5%
    if (!isSwap || fromChain.chainId !== toChain.chainId) {
      return SlippageValue.BridgeDefault;
    }

    // 2. Solana swap → undefined (AUTO mode)
    if (isSolanaChainId(fromChain.chainId)) {
      return undefined;
    }

    // 3. EVM swap → check for stablecoin pair
    if (isStablecoinPair(fromChain.chainId, fromToken, toToken)) {
      return SlippageValue.EvmStablecoin; // 0.5%
    }

    // Default EVM swap → 2%
    return SlippageValue.EvmDefault;
}

/**
 * Gets a human-readable description of why a certain slippage was chosen
 * Useful for debugging and logging
 *
 * @param context
 */
export function getSlippageReason(context: SlippageContext): string {
    const { fromChain, toChain, fromToken, toToken, isSwap } = context;

    if (!fromChain?.chainId || !toChain?.chainId) {
      return 'Incomplete chain setup - using bridge default';
    }

    if (!isSwap || fromChain.chainId !== toChain.chainId) {
      return 'Cross-chain transaction';
    }

    if (isSolanaChainId(fromChain.chainId)) {
      return 'Solana swap (AUTO mode)';
    }

    if (isStablecoinPair(fromChain.chainId, fromToken, toToken)) {
      return 'EVM stablecoin pair';
    }

    return 'EVM token swap';
}
