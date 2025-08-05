import { isSolanaChainId } from '@metamask/bridge-controller';
import { StablecoinsByChainId } from '../../constants/stablecoins';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import type { BridgeToken } from '../../../ui/ducks/bridge/types';

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

    const stablecoins = StablecoinsByChainId[chainId];
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
   * - Swap on EVM stablecoin pairs: 0.5%
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

    // Solana swaps always use undefined (AUTO mode)
    // Must check that BOTH chains are Solana
    if (
      isSolanaChainId(fromChain.chainId) &&
      isSolanaChainId(toChain.chainId)
    ) {
      return undefined;
    }

    // EVM stablecoin pairs use 0.5%
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

    if (
      isSolanaChainId(fromChain.chainId) &&
      isSolanaChainId(toChain.chainId)
    ) {
      return 'Solana swap (AUTO mode)';
    }

    if (this.isStablecoinPair(fromChain.chainId, fromToken, toToken)) {
      return 'EVM stablecoin pair';
    }

    return 'EVM token swap';
  }
}
