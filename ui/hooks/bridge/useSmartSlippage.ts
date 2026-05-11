import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  calculateSlippage,
  getSlippageReason,
  type SlippageContext,
} from '../../pages/bridge/utils/slippage-service';
import { setSlippage } from '../../ducks/bridge/actions';
import { getFromToken, getToToken } from '../../ducks/bridge/selectors';
import { getIsRWATokensEnabled } from '../../selectors/rwa/feature-flags';

// This hook doesn't return anything as it only dispatches slippage updates
// The slippage value can be accessed via getSlippage selector

/**
 * Custom hook that manages smart slippage defaults
 *
 * Features:
 * - Sets intelligent defaults based on token types and chains
 * - Updates automatically when tokens/chains change
 * - Supports Solana AUTO mode (undefined)
 */
export function useSmartSlippage(): void {
  const dispatch = useDispatch();
  const fromToken = useSelector(getFromToken);
  const toToken = useSelector(getToToken);
  const isRWAEnabled = useSelector(getIsRWATokensEnabled);

  // Update slippage when context changes
  useEffect(() => {
    const context: SlippageContext = { fromToken, toToken, isRWAEnabled };
    const newSlippage = calculateSlippage(context);

    if (process.env.NODE_ENV === 'development') {
      const reason = getSlippageReason(context);
      console.log(
        `[useSmartSlippage] Slippage calculated: ${newSlippage ?? 'AUTO'}% - ${reason}`,
      );
    }

    dispatch(setSlippage(newSlippage));
  }, [fromToken, toToken, isRWAEnabled, dispatch]);
}
