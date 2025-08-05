import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  SlippageService,
  type SlippageContext,
} from '../../../shared/lib/bridge/slippage-service';
import { setSlippage } from '../../ducks/bridge/actions';
import { getSlippage, BridgeAppState } from '../../ducks/bridge/selectors';
import type { BridgeToken } from '../../ducks/bridge/types';

type UseSmartSlippageParams = {
  fromChain: { chainId: string } | null | undefined;
  toChain: { chainId: string } | null | undefined;
  fromToken: BridgeToken | null;
  toToken: BridgeToken | null;
  isSwap: boolean;
  enabled?: boolean;
};

type UseSmartSlippageResult = {
  slippage: number | undefined;
  isUserOverride: boolean;
  resetToDefault: () => void;
};

/**
 * Custom hook that manages smart slippage defaults while respecting user overrides
 *
 * Features:
 * - Sets intelligent defaults based on token types and chains
 * - Respects user manual changes (won't override them)
 * - Updates automatically when tokens change (if using defaults)
 * - Provides a way to reset to smart defaults
 * - Supports Solana AUTO mode (undefined)
 *
 * @param options0
 * @param options0.fromChain
 * @param options0.toChain
 * @param options0.fromToken
 * @param options0.toToken
 * @param options0.isSwap
 * @param options0.enabled
 */
export function useSmartSlippage({
  fromChain,
  toChain,
  fromToken,
  toToken,
  isSwap,
  enabled = true,
}: UseSmartSlippageParams): UseSmartSlippageResult {
  const dispatch = useDispatch();
  const currentSlippage = useSelector((state: BridgeAppState) =>
    getSlippage(state),
  );

  // Track if user has manually set slippage
  const isUserOverrideRef = useRef(false);
  const lastSetSlippageRef = useRef<number | undefined>(undefined);

  // Calculate the appropriate slippage for current context
  const calculateCurrentSlippage = useCallback(() => {
    // Need at least fromChain to make any determination
    if (!enabled || !fromChain?.chainId) {
      return undefined;
    }

    const context: SlippageContext = {
      fromChain,
      toChain,
      fromToken,
      toToken,
      isSwap,
    };

    const slippage = SlippageService.calculateSlippage(context);

    // Log the reason in development
    if (process.env.NODE_ENV === 'development') {
      const reason = SlippageService.getSlippageReason(context);
      console.log(`[useSmartSlippage] Slippage calculated: ${slippage ?? 'AUTO'}% - ${reason}`);
    }

    return slippage;
  }, [fromChain, toChain, fromToken, toToken, isSwap, enabled]);

  // Initialize or update slippage when context changes
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const newSlippage = calculateCurrentSlippage();

    // If user hasn't overridden, update to the new calculated value
    if (!isUserOverrideRef.current) {
      dispatch(setSlippage(newSlippage));
      lastSetSlippageRef.current = newSlippage;
    }
  }, [
    fromChain,
    toChain,
    fromToken,
    toToken,
    isSwap,
    enabled,
    calculateCurrentSlippage,
    dispatch,
  ]);

  // Detect user manual changes
  useEffect(() => {
    // If current slippage differs from what we last set programmatically,
    // the user must have changed it manually
    if (
      currentSlippage !== lastSetSlippageRef.current &&
      lastSetSlippageRef.current !== undefined
    ) {
      isUserOverrideRef.current = true;
    }
  }, [currentSlippage]);

  // Function to reset to smart defaults
  const resetToDefault = useCallback(() => {
    const newSlippage = calculateCurrentSlippage();
    dispatch(setSlippage(newSlippage));
    lastSetSlippageRef.current = newSlippage;
    isUserOverrideRef.current = false;
  }, [calculateCurrentSlippage, dispatch]);

  return {
    slippage: currentSlippage,
    isUserOverride: isUserOverrideRef.current,
    resetToDefault,
  };
}
