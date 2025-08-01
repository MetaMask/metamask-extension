import { isSolanaChainId } from '@metamask/bridge-controller';
import { StablecoinsByChainId } from '../../constants/stablecoins';
import type { BridgeToken } from '../../../ui/ducks/bridge/types';

/**
 * Slippage values for different scenarios
 */
export enum SlippageValue {
  SOLANA_SWAP = 0.5,
  EVM_STABLECOIN = 0.5,
  EVM_DEFAULT = 2,
  BRIDGE_DEFAULT = 0.5,
}

/**
 * Context for calculating slippage
 */
export interface SlippageContext {
  fromChain: { chainId: string } | null | undefined;
  toChain: { chainId: string } | null | undefined;
  fromToken: BridgeToken | null;
  toToken: BridgeToken | null;
  isSwap: boolean;
}

/**
 * Service for calculating smart default slippage values based on transaction context
 */
export class SlippageService {
  /**
   * Checks if a token address is a stablecoin on the given chain
   */
  private static isStablecoin(
    chainId: string,
    tokenAddress: string | undefined,
  ): boolean {
    if (!tokenAddress) return false;

    const stablecoins = StablecoinsByChainId[chainId];
    if (!stablecoins) return false;

    return stablecoins.has(tokenAddress.toLowerCase());
  }

  /**
   * Checks if both tokens in a pair are stablecoins
   */
  private static isStablecoinPair(
    chainId: string,
    fromToken: BridgeToken | null,
    toToken: BridgeToken | null,
  ): boolean {
    if (!fromToken || !toToken) return false;

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
   * - Swap on Solana: Always 0.5%
   * - Swap on EVM stablecoin pairs: 0.5%
   * - Swap on EVM other pairs: 2%
   */
  public static calculateSlippage(context: SlippageContext): number {
    const { fromChain, toChain, fromToken, toToken, isSwap } = context;

    // If no source chain, return bridge default
    if (!fromChain) {
      return SlippageValue.BRIDGE_DEFAULT;
    }

    // Bridge transactions always use 0.5%
    if (!isSwap) {
      return SlippageValue.BRIDGE_DEFAULT;
    }

    // Solana swaps always use 0.5%
    if (isSolanaChainId(fromChain.chainId)) {
      return SlippageValue.SOLANA_SWAP;
    }

    // EVM stablecoin pairs use 0.5%
    if (this.isStablecoinPair(fromChain.chainId, fromToken, toToken)) {
      return SlippageValue.EVM_STABLECOIN;
    }

    // All other EVM swaps use 2%
    return SlippageValue.EVM_DEFAULT;
  }

  /**
   * Gets a human-readable description of why a certain slippage was chosen
   * Useful for debugging and logging
   */
  public static getSlippageReason(context: SlippageContext): string {
    const { fromChain, toChain, fromToken, toToken, isSwap } = context;

    if (!fromChain) {
      return 'No source chain - using bridge default';
    }

    if (!isSwap) {
      return 'Cross-chain bridge transaction';
    }

    if (isSolanaChainId(fromChain.chainId)) {
      return 'Solana swap';
    }

    if (this.isStablecoinPair(fromChain.chainId, fromToken, toToken)) {
      return 'EVM stablecoin pair';
    }

    return 'EVM token swap';
  }
}
