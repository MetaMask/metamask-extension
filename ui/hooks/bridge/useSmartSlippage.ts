import { useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
  calculateSlippage,
  getSlippageReason,
  type SlippageContext,
} from '../../pages/bridge/utils/slippage-service';
import { setSlippage } from '../../ducks/bridge/actions';
import type { BridgeToken } from '../../ducks/bridge/types';

type UseSmartSlippageParams = {
  fromToken: BridgeToken | null;
  toToken: BridgeToken | null;
  isSwap: boolean;
};

// This hook doesn't return anything as it only dispatches slippage updates
// The slippage value can be accessed via getSlippage selector

/**
 * Custom hook that manages smart slippage defaults
 *
 * Features:
 * - Sets intelligent defaults based on token types and chains
 * - Updates automatically when tokens/chains change
 * - Supports Solana AUTO mode (undefined)
 *
 * @param options0
 * @param options0.fromToken
 * @param options0.toToken
 * @param options0.isSwap
 */
export function useSmartSlippage({
  fromToken,
  toToken,
  isSwap,
}: UseSmartSlippageParams): void {
  const dispatch = useDispatch();

  // Calculate the appropriate slippage for current context
  const calculateCurrentSlippage = useCallback((context: SlippageContext) => {
    const slippage = calculateSlippage(context);

    // Log the reason in development
    if (process.env.NODE_ENV === 'development') {
      const reason = getSlippageReason(context);
      console.log(
        `[useSmartSlippage] Slippage calculated: ${slippage ?? 'AUTO'}% - ${reason}`,
      );
    }

    return slippage;
  }, []);

  // Update slippage when context changes
  useEffect(() => {
    const context: SlippageContext = {
      fromChain: { chainId: fromToken?.chainId ?? '' },
      toChain: { chainId: toToken?.chainId ?? '' },
      fromToken,
      toToken,
      isSwap,
    };

    const newSlippage = calculateCurrentSlippage(context);
    dispatch(setSlippage(newSlippage));
  }, [fromToken, toToken, isSwap, calculateCurrentSlippage, dispatch]);
}
