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
 * Service for calculating smart default slippage values based on transaction context
 */
export class SlippageService {
  /**
   * Checks if a token address is a stablecoin on the given chain
   *
   * @param chainId
   * @param tokenAddress
   */
  private static isStablecoin(
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
  private static isStablecoinPair(
    chainId: string,
    fromToken: BridgeToken | null,
    toToken: BridgeToken | null,
  ): boolean {
    if (!fromToken || !toToken) {
      return false;
    }

    return (
      this.isStablecoin(chainId, fromToken.address) &&
      this.isStablecoin(chainId, toToken.address)
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
  public static calculateSlippage(
    context: SlippageContext,
  ): number | undefined {
    const { fromChain, toChain, fromToken, toToken, isSwap } = context;

    // If no source chain, we can't determine the type
    if (!fromChain?.chainId) {
      return SlippageValue.BridgeDefault;
    }

    // Bridge transactions always use 0.5%
    if (!isSwap) {
      return SlippageValue.BridgeDefault;
    }

    // For swaps, we need both chains to be set
    if (!toChain?.chainId) {
      return SlippageValue.EvmDefault;
    }

    // Cross-chain swaps are treated as bridges (0.5%)
    if (fromChain.chainId !== toChain.chainId) {
      return SlippageValue.BridgeDefault;
    }

    // Solana swaps always use undefined (AUTO mode)
    // Must check that BOTH chains are Solana (already same chain at this point)
    if (isSolanaChainId(fromChain.chainId)) {
      return undefined;
    }

    // EVM stablecoin pairs use 0.5% (only for same-chain swaps)
    if (this.isStablecoinPair(fromChain.chainId, fromToken, toToken)) {
      return SlippageValue.EvmStablecoin;
    }

    // All other EVM swaps use 2%
    return SlippageValue.EvmDefault;
  }

  /**
   * Gets a human-readable description of why a certain slippage was chosen
   * Useful for debugging and logging
   *
   * @param context
   */
  public static getSlippageReason(context: SlippageContext): string {
    const { fromChain, toChain, fromToken, toToken, isSwap } = context;

    if (!fromChain?.chainId) {
      return 'No source chain - using bridge default';
    }

    if (!isSwap) {
      return 'Cross-chain bridge transaction';
    }

    if (!toChain?.chainId) {
      return 'Incomplete swap setup - using EVM default';
    }

    if (fromChain.chainId !== toChain.chainId) {
      return 'Cross-chain swap (treated as bridge)';
    }

    if (isSolanaChainId(fromChain.chainId)) {
      return 'Solana swap (AUTO mode)';
    }

    if (this.isStablecoinPair(fromChain.chainId, fromToken, toToken)) {
      return 'EVM stablecoin pair';
    }

    return 'EVM token swap';
  }
}
