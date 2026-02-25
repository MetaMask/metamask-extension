import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
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
import type { OrderType } from '@metamask/perps-controller';

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
 * Custom hook for managing perps order form state
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
 * @param options.orderType - Order type: 'market' or 'limit' (defaults to 'market')
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
   * Compute margin, balance percent, and TP/SL from an existing position.
   * Uses the position's own entry price (not the volatile live price) so the
   * result is stable across re-renders caused by price ticks.
   *
   * @param pos - Existing position data
   * @param balance - Available balance for computing percent
   */
  function deriveModifyFields(
    pos: ExistingPositionData,
    balance: number,
  ): Partial<OrderFormState> {
    const entryPrice = parseFloat(pos.entryPrice.replace(/,/gu, '')) || 0;
    const absSize = Math.abs(parseFloat(pos.size.replace(/,/gu, ''))) || 0;
    const margin =
      entryPrice > 0 && pos.leverage > 0
        ? (absSize * entryPrice) / pos.leverage
        : 0;
    const balancePercent =
      balance > 0 ? Math.min(Math.round((margin / balance) * 100), 100) : 0;
    return {
      amount: margin > 0 ? margin.toFixed(2) : '',
      leverage: pos.leverage,
      balancePercent,
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
        ...deriveModifyFields(existingPosition, availableBalance),
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

  // Ref so the reset effect can read the latest balance without depending on
  // it, preventing live price ticks from wiping user edits.
  const availableBalanceRef = useRef(availableBalance);
  availableBalanceRef.current = availableBalance;

  useEffect(() => {
    setClosePercent(100);

    if (mode === 'modify' && existingPosition) {
      setFormState({
        ...mockOrderFormDefaults,
        asset,
        direction: initialDirection,
        type: orderType,
        ...deriveModifyFields(existingPosition, availableBalanceRef.current),
      });
    } else {
      setFormState({
        ...mockOrderFormDefaults,
        asset,
        direction: initialDirection,
        type: orderType,
      });
    }
  }, [mode, existingPosition, asset, initialDirection, orderType]);

  // Re-derive modify fields when availableBalance transitions from 0 to a
  // real value (e.g. account data loading after mount).
  const prevBalanceRef = useRef(availableBalance);
  useEffect(() => {
    const wasZero = prevBalanceRef.current === 0;
    prevBalanceRef.current = availableBalance;
    if (
      wasZero &&
      availableBalance > 0 &&
      mode === 'modify' &&
      existingPosition
    ) {
      setFormState((prev) => ({
        ...prev,
        ...deriveModifyFields(existingPosition, availableBalance),
      }));
    }
  }, [availableBalance, mode, existingPosition]);

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
        orderValue: null,
        estimatedFees: null,
      };
    }

    // User enters MARGIN amount. Position value = margin × leverage
    const positionValue = amount * formState.leverage;
    const positionSize = calculatePositionSize(positionValue, currentPrice);
    const marginRequired = amount; // The entered amount IS the margin
    const liquidationPrice = estimateLiquidationPrice(
      currentPrice,
      formState.leverage,
      formState.direction === 'long',
    );
    // Mock fee calculation: 0.05% of position value (not margin)
    const estimatedFees = positionValue * 0.0005;

    return {
      positionSize: formatTokenQuantity(positionSize, asset),
      marginRequired: formatCurrencyWithMinThreshold(marginRequired, 'USD'),
      liquidationPrice: formatCurrencyWithMinThreshold(liquidationPrice, 'USD'),
      orderValue: formatCurrencyWithMinThreshold(positionValue, 'USD'),
      estimatedFees: formatCurrencyWithMinThreshold(estimatedFees, 'USD'),
    };
  }, [
    formState.amount,
    formState.leverage,
    formState.direction,
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
