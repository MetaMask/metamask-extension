import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { SlippageService, type SlippageContext } from '../../../shared/lib/bridge/slippage-service';
import { setSlippage } from '../../ducks/bridge/actions';
import { getSlippage, BridgeAppState } from '../../ducks/bridge/selectors';
import type { BridgeToken } from '../../ducks/bridge/types';

interface UseSmartSlippageParams {
  fromChain: { chainId: string } | null | undefined;
  toChain: { chainId: string } | null | undefined;
  fromToken: BridgeToken | null;
  toToken: BridgeToken | null;
  isSwap: boolean;
  enabled?: boolean;
}

interface UseSmartSlippageResult {
  slippage: number | undefined;
  isUserOverride: boolean;
  resetToDefault: () => void;
}

/**
 * Custom hook that manages smart slippage defaults while respecting user overrides
 *
 * Features:
 * - Sets intelligent defaults based on token types and chains
 * - Respects user manual changes (won't override them)
 * - Updates automatically when tokens change (if using defaults)
 * - Provides a way to reset to smart defaults
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
  const currentSlippage = useSelector((state: BridgeAppState) => getSlippage(state));

  // Track if user has manually set slippage
  const isUserOverrideRef = useRef(false);
  const lastCalculatedSlippageRef = useRef<number | undefined>(undefined);

  // Track previous context to detect changes
  const prevContextRef = useRef<SlippageContext>({
    fromChain: fromChain ?? null,
    toChain: toChain ?? null,
    fromToken,
    toToken,
    isSwap,
  });

  // Calculate the appropriate slippage for current context
  const calculateCurrentSlippage = useCallback(() => {
    if (!enabled || !fromChain) return undefined;

    const context: SlippageContext = {
      fromChain: fromChain ?? null,
      toChain: toChain ?? null,
      fromToken,
      toToken,
      isSwap,
    };

    const slippage = SlippageService.calculateSlippage(context);

    // Log the reason in development
    if (process.env.NODE_ENV === 'development') {
      const reason = SlippageService.getSlippageReason(context);
      console.log(`Slippage calculated: ${slippage}% - ${reason}`);
    }

    return slippage;
  }, [fromChain, toChain, fromToken, toToken, isSwap, enabled]);

  // Check if context has changed significantly
  const hasContextChanged = useCallback(() => {
    const prev = prevContextRef.current;

    // Check if chains changed
    if (prev.fromChain?.chainId !== fromChain?.chainId) return true;
    if (prev.toChain?.chainId !== toChain?.chainId) return true;

    // Check if swap/bridge mode changed
    if (prev.isSwap !== isSwap) return true;

    // Check if tokens changed (comparing addresses)
    if (prev.fromToken?.address !== fromToken?.address) return true;
    if (prev.toToken?.address !== toToken?.address) return true;

    return false;
  }, [fromChain, toChain, fromToken, toToken, isSwap]);

  // Initialize or update slippage when context changes
  useEffect(() => {
    if (!enabled) return;

    const newSlippage = calculateCurrentSlippage();
    if (newSlippage === undefined) return;

    // First initialization - always set
    if (lastCalculatedSlippageRef.current === undefined) {
      dispatch(setSlippage(newSlippage));
      lastCalculatedSlippageRef.current = newSlippage;
      isUserOverrideRef.current = false;
      return;
    }

    // Context changed - only update if not user override
    if (hasContextChanged() && !isUserOverrideRef.current) {
      dispatch(setSlippage(newSlippage));
      lastCalculatedSlippageRef.current = newSlippage;
    }

    // Update context reference
    prevContextRef.current = {
      fromChain: fromChain ?? null,
      toChain: toChain ?? null,
      fromToken,
      toToken,
      isSwap,
    };
  }, [
    fromChain,
    toChain,
    fromToken,
    toToken,
    isSwap,
    enabled,
    calculateCurrentSlippage,
    hasContextChanged,
    dispatch,
  ]);

  // Detect user manual changes
  useEffect(() => {
    if (!enabled) return;

    // If current slippage differs from our last calculated value,
    // and we have a calculated value, user must have changed it
    if (
      currentSlippage !== undefined &&
      lastCalculatedSlippageRef.current !== undefined &&
      currentSlippage !== lastCalculatedSlippageRef.current
    ) {
      isUserOverrideRef.current = true;
    }
  }, [currentSlippage, enabled]);

  // Function to reset to smart defaults
  const resetToDefault = useCallback(() => {
    const newSlippage = calculateCurrentSlippage();
    if (newSlippage !== undefined) {
      dispatch(setSlippage(newSlippage));
      lastCalculatedSlippageRef.current = newSlippage;
      isUserOverrideRef.current = false;
    }
  }, [calculateCurrentSlippage, dispatch]);

  return {
    slippage: currentSlippage,
    isUserOverride: isUserOverrideRef.current,
    resetToDefault,
  };
}
