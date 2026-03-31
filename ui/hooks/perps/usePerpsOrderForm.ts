import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { OrderType } from '@metamask/perps-controller';
import { useFormatters } from '../useFormatters';
import type {
  OrderFormState,
  OrderMode,
  ExistingPositionData,
} from '../../components/app/perps/order-entry/order-entry.types';
import {
  mockOrderFormDefaults,
  calculatePositionSize,
  estimateLiquidationPrice,
} from '../../components/app/perps/order-entry/order-entry.mocks';

export type UsePerpsOrderFormOptions = {
  /** Asset symbol */
  asset: string;
  /** Current asset price in USD */
  currentPrice: number;
  /** Initial order direction */
  initialDirection: 'long' | 'short';
  /** Order mode: 'new', 'modify', or 'close' */
  mode: OrderMode;
  /** Existing position data for pre-population */
  existingPosition?: ExistingPositionData;
  /** Available balance for trading (used to compute balancePercent) */
  availableBalance?: number;
  /** Callback when form state changes */
  onFormStateChange?: (formState: OrderFormState) => void;
  /** Callback when order is submitted */
  onSubmit?: (formState: OrderFormState) => void;
  /** Order type: 'market' or 'limit' (defaults to 'market') */
  orderType?: OrderType;
};

export type UsePerpsOrderFormReturn = {
  /** Current form state */
  formState: OrderFormState;
  /** Close percentage (for close mode) */
  closePercent: number;
  /** Calculated values (position size, margin, liquidation price, etc.) */
  calculations: {
    positionSize: string | null;
    marginRequired: string | null;
    liquidationPrice: string | null;
    liquidationPriceRaw: number | null;
    orderValue: string | null;
    estimatedFees: string | null;
  };
  /** Handler for amount changes */
  handleAmountChange: (amount: string) => void;
  /** Handler for balance percent changes */
  handleBalancePercentChange: (balancePercent: number) => void;
  /** Handler for leverage changes */
  handleLeverageChange: (leverage: number) => void;
  /** Handler for auto-close enabled changes */
  handleAutoCloseEnabledChange: (enabled: boolean) => void;
  /** Handler for take profit price changes */
  handleTakeProfitPriceChange: (takeProfitPrice: string) => void;
  /** Handler for stop loss price changes */
  handleStopLossPriceChange: (stopLossPrice: string) => void;
  /** Handler for close percent changes (close mode only) */
  handleClosePercentChange: (percent: number) => void;
  /** Handler for limitPrice changes */
  handleLimitPriceChange: (limitPrice: string) => void;
  /** Handler for order type changes */
  handleOrderTypeChange: (type: OrderType) => void;
  /** Handler for form submission */
  handleSubmit: () => void;
};

/**
 * Custom hook for managing perps order form state.
 *
 * Encapsulates all form state, handlers, and calculations for the order entry form.
 * Supports three modes: 'new', 'modify', and 'close'.
 *
 * @param options - Hook configuration options
 * @param options.asset - Asset symbol
 * @param options.currentPrice - Current asset price in USD
 * @param options.initialDirection - Initial order direction
 * @param options.mode - Order mode: 'new', 'modify', or 'close'
 * @param options.existingPosition - Existing position data for pre-population
 * @param options.availableBalance - Available balance for trading
 * @param options.onFormStateChange - Callback when form state changes
 * @param options.onSubmit - Callback when order is submitted
 * @param options.orderType - Order type: 'market' or 'limit'
 * @returns Form state, handlers, and calculated values
 */
export function usePerpsOrderForm({
  asset,
  currentPrice,
  initialDirection,
  mode,
  existingPosition,
  availableBalance = 0,
  onFormStateChange,
  onSubmit,
  orderType = 'market',
}: UsePerpsOrderFormOptions): UsePerpsOrderFormReturn {
  const { formatCurrencyWithMinThreshold, formatTokenQuantity } =
    useFormatters();

  // Close percentage state (for 'close' mode, defaults to 100%)
  const [closePercent, setClosePercent] = useState<number>(100);

  /**
   * Compute TP/SL and leverage from an existing position for modify mode.
   * Amount is left empty so the user enters the size INCREASE (additional margin
   * to add), not the total position size.
   *
   * @param pos - Existing position data
   */
  function deriveModifyFields(
    pos: ExistingPositionData,
  ): Partial<OrderFormState> {
    return {
      amount: '',
      balancePercent: 0,
      leverage: pos.leverage,
      takeProfitPrice: pos.takeProfitPrice ?? '',
      stopLossPrice: pos.stopLossPrice ?? '',
      autoCloseEnabled: Boolean(pos.takeProfitPrice || pos.stopLossPrice),
    };
  }

  // Initialize form state based on mode
  const [formState, setFormState] = useState<OrderFormState>(() => {
    if (mode === 'modify' && existingPosition) {
      return {
        ...mockOrderFormDefaults,
        asset,
        direction: initialDirection,
        type: orderType,
        ...deriveModifyFields(existingPosition),
      };
    }
    return {
      ...mockOrderFormDefaults,
      asset,
      direction: initialDirection,
      type: orderType,
    };
  });

  // Update order type when prop changes (from dropdown)
  useEffect(() => {
    setFormState((prev) => ({ ...prev, type: orderType }));
  }, [orderType]);

  // Refs so the reset effect can read latest values without depending on them,
  // preventing stream updates (new object refs) from wiping user edits.
  const availableBalanceRef = useRef(availableBalance);
  availableBalanceRef.current = availableBalance;
  const existingPositionRef = useRef(existingPosition);
  existingPositionRef.current = existingPosition;
  const orderTypeRef = useRef(orderType);
  orderTypeRef.current = orderType;

  // Track which deps trigger a full form reset. orderType changes should NOT
  // reset amount/leverage—only the effect above updates formState.type.
  // Ref starts null so the first effect run always applies. `existingPosition`
  // uses undefined vs JSON digest so async hydration cannot collide with a size
  // string like "none" the way a single concatenated key could.
  const prevResetDepsRef = useRef<{
    mode: OrderMode;
    asset: string;
    initialDirection: 'long' | 'short';
    existingPositionDigest: string | undefined;
  } | null>(null);
  useEffect(() => {
    const existingPositionDigest =
      existingPosition === undefined
        ? undefined
        : JSON.stringify({
            size: existingPosition.size,
            entryPrice: existingPosition.entryPrice,
            leverage: existingPosition.leverage,
            takeProfitPrice: existingPosition.takeProfitPrice ?? null,
            stopLossPrice: existingPosition.stopLossPrice ?? null,
          });

    const prev = prevResetDepsRef.current;
    if (
      prev !== null &&
      prev.mode === mode &&
      prev.asset === asset &&
      prev.initialDirection === initialDirection &&
      prev.existingPositionDigest === existingPositionDigest
    ) {
      return;
    }

    prevResetDepsRef.current = {
      mode,
      asset,
      initialDirection,
      existingPositionDigest,
    };

    setClosePercent(100);

    const pos = existingPositionRef.current;
    const typeForReset = orderTypeRef.current;
    if (mode === 'modify' && pos) {
      setFormState({
        ...mockOrderFormDefaults,
        asset,
        direction: initialDirection,
        type: typeForReset,
        ...deriveModifyFields(pos),
      });
    } else {
      setFormState({
        ...mockOrderFormDefaults,
        asset,
        direction: initialDirection,
        type: typeForReset,
      });
    }
  }, [mode, asset, initialDirection]);

  // Notify parent of form state changes
  useEffect(() => {
    onFormStateChange?.(formState);
  }, [formState, onFormStateChange]);

  // Calculate derived values
  const calculations = useMemo(() => {
    // For close mode, calculate based on close amount
    if (mode === 'close' && existingPosition) {
      const positionSize = Math.abs(parseFloat(existingPosition.size)) || 0;
      const closeAmount = (positionSize * closePercent) / 100;
      const closeValueUsd = closeAmount * currentPrice;

      // Mock fee calculation: 0.05% of close value
      const estimatedFees = closeValueUsd * 0.0005;

      return {
        positionSize: formatTokenQuantity(closeAmount, asset),
        marginRequired: null, // Not relevant for closing
        liquidationPrice: null, // Not relevant for closing
        liquidationPriceRaw: null,
        orderValue: formatCurrencyWithMinThreshold(closeValueUsd, 'USD'),
        estimatedFees: formatCurrencyWithMinThreshold(estimatedFees, 'USD'),
      };
    }

    // For new/modify modes, calculate based on form amount
    // Remove commas from formatted amount for parsing
    const cleanAmount = formState.amount.replace(/,/gu, '');
    const amount = parseFloat(cleanAmount.replace(/,/gu, '')) || 0;

    if (amount === 0) {
      return {
        positionSize: null,
        marginRequired: null,
        liquidationPrice: null,
        liquidationPriceRaw: null,
        orderValue: null,
        estimatedFees: null,
      };
    }

    // For limit orders, use the user-specified limit price for calculations.
    // Fall back to current market price if limit price is empty/invalid.
    let effectivePrice = currentPrice;
    if (formState.type === 'limit' && formState.limitPrice) {
      const parsedLimitPrice = Number.parseFloat(
        formState.limitPrice.replaceAll(',', ''),
      );
      if (!Number.isNaN(parsedLimitPrice) && parsedLimitPrice > 0) {
        effectivePrice = parsedLimitPrice;
      }
    }

    // User enters MARGIN amount. Position value = margin × leverage
    const positionValue = amount * formState.leverage;
    const positionSize = calculatePositionSize(positionValue, effectivePrice);
    const marginRequired = amount; // The entered amount IS the margin
    const liquidationPrice = estimateLiquidationPrice(
      effectivePrice,
      formState.leverage,
      formState.direction === 'long',
    );
    // Mock fee calculation: 0.05% of position value (not margin)
    const estimatedFees = positionValue * 0.0005;

    return {
      positionSize: formatTokenQuantity(positionSize, asset),
      marginRequired: formatCurrencyWithMinThreshold(marginRequired, 'USD'),
      liquidationPrice: formatCurrencyWithMinThreshold(liquidationPrice, 'USD'),
      liquidationPriceRaw: liquidationPrice,
      orderValue: formatCurrencyWithMinThreshold(positionValue, 'USD'),
      estimatedFees: formatCurrencyWithMinThreshold(estimatedFees, 'USD'),
    };
  }, [
    formState.amount,
    formState.leverage,
    formState.direction,
    formState.type,
    formState.limitPrice,
    currentPrice,
    mode,
    existingPosition,
    closePercent,
    asset,
    formatCurrencyWithMinThreshold,
    formatTokenQuantity,
  ]);

  // Form state update handlers
  const handleAmountChange = useCallback((amount: string) => {
    setFormState((prev) => ({ ...prev, amount }));
  }, []);

  const handleBalancePercentChange = useCallback((balancePercent: number) => {
    setFormState((prev) => ({ ...prev, balancePercent }));
  }, []);

  const handleLeverageChange = useCallback((leverage: number) => {
    setFormState((prev) => ({ ...prev, leverage }));
  }, []);

  const handleAutoCloseEnabledChange = useCallback((enabled: boolean) => {
    setFormState((prev) => ({ ...prev, autoCloseEnabled: enabled }));
  }, []);

  const handleTakeProfitPriceChange = useCallback((takeProfitPrice: string) => {
    setFormState((prev) => ({ ...prev, takeProfitPrice }));
  }, []);

  const handleStopLossPriceChange = useCallback((stopLossPrice: string) => {
    setFormState((prev) => ({ ...prev, stopLossPrice }));
  }, []);

  // Close percent change handler (for close mode)
  const handleClosePercentChange = useCallback((percent: number) => {
    setClosePercent(percent);
  }, []);

  // Limit price change handler (for limit order mode)
  const handleLimitPriceChange = useCallback((limitPrice: string) => {
    setFormState((prev) => ({ ...prev, limitPrice }));
  }, []);

  const handleOrderTypeChange = useCallback((type: OrderType) => {
    setFormState((prev) => ({ ...prev, type }));
  }, []);

  // Submit handler
  const handleSubmit = useCallback(() => {
    onSubmit?.(formState);
  }, [formState, onSubmit]);

  return {
    formState,
    closePercent,
    calculations,
    handleAmountChange,
    handleBalancePercentChange,
    handleLeverageChange,
    handleAutoCloseEnabledChange,
    handleTakeProfitPriceChange,
    handleStopLossPriceChange,
    handleClosePercentChange,
    handleLimitPriceChange,
    handleOrderTypeChange,
    handleSubmit,
  };
}
