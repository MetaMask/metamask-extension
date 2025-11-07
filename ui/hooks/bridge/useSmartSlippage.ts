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
  fromToken: BridgeToken;
  toToken: BridgeToken;
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
 */
export function useSmartSlippage({
  fromToken,
  toToken,
}: UseSmartSlippageParams): void {
  const dispatch = useDispatch();

  // Calculate the appropriate slippage for current context
  const calculateCurrentSlippage = useCallback(
    (fromTokenInput: BridgeToken, toTokenInput: BridgeToken) => {
      const context: SlippageContext = {
        fromToken: fromTokenInput,
        toToken: toTokenInput,
      };

      const slippage = calculateSlippage(context);

      // Log the reason in development
      if (process.env.NODE_ENV === 'development') {
        const reason = getSlippageReason(context);
        console.log(
          `[useSmartSlippage] Slippage calculated: ${slippage ?? 'AUTO'}% - ${reason}`,
        );
      }

      return slippage;
    },
    [],
  );

  // Update slippage when context changes
  useEffect(() => {
    const newSlippage = calculateCurrentSlippage(fromToken, toToken);
    dispatch(setSlippage(newSlippage));
  }, [fromToken, toToken, calculateCurrentSlippage, dispatch]);
}
