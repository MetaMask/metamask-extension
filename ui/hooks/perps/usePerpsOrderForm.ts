import type { OrderType } from '@metamask/perps-controller';
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

import {
  mockOrderFormDefaults,
  calculatePositionSize,
} from '../../components/app/perps/order-entry/order-entry.mocks';
import type {
  OrderFormState,
  OrderMode,
  ExistingPositionData,
} from '../../components/app/perps/order-entry/order-entry.types';
import { useFormatters } from '../useFormatters';
import { formatPerpsPrice } from '../../../shared/lib/perps-formatters';
import { getIntlLocale } from '../../ducks/locale/locale';

/**
 * Calculate the estimated liquidation price for an isolated-margin position.
 *
 * Implements the same formula as HyperLiquidProvider.calculateLiquidationPrice,
 * but synchronously — maxLeverage is already available from market data.
 *
 * @param entryPrice - Position entry price
 * @param leverage - User-selected leverage
 * @param direction - 'long' or 'short'
 * @param maxLeverage - Maximum leverage allowed for the asset (from market data)
 * @returns Estimated liquidation price (0 if inputs are invalid)
 */
function calculateLiquidationPrice(
  entryPrice: number,
  leverage: number,
  direction: 'long' | 'short',
  maxLeverage: number,
): number {
  if (entryPrice <= 0 || leverage <= 0 || maxLeverage <= 0) {
    return 0;
  }

  const maintenanceMarginRate = 1 / (2 * maxLeverage);
  const side = direction === 'long' ? 1 : -1;

  const initialMarginRate = 1 / leverage;

  if (initialMarginRate < maintenanceMarginRate) {
    return 0;
  }

  const marginAvailable = initialMarginRate - maintenanceMarginRate;
  const denominator = 1 - maintenanceMarginRate * side;

  if (Math.abs(denominator) < 0.0001) {
    return entryPrice;
  }

  const liquidationPrice =
    entryPrice - (side * marginAvailable * entryPrice) / denominator;
  return Math.max(0, liquidationPrice);
}

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
  /** Initial leverage for new orders (e.g. last used leverage for this market) */
  initialLeverage?: number;
  /**
   * Maximum leverage allowed for this asset (from market data).
   * Used in the HyperLiquid liquidation price formula.
   * Defaults to 50 when market data is unavailable.
   */
  maxLeverage?: number;
  /**
   * HyperLiquid size decimals for this asset (from MarketInfo.szDecimals).
   * Controls how position size is rounded before computing notional and margin,
   * mirroring mobile's calculatePositionSize → markPrice × roundedSize → / leverage chain.
   * Defaults to 0 (no rounding) when market info is unavailable.
   */
  szDecimals?: number;
  /**
   * Oracle mark price for this asset (oraclePx from HyperLiquid's activeAssetCtx feed).
   * Used exclusively for margin calculation (position-size rounding + notional + marginRequired).
   * This is the price HyperLiquid itself uses to assess margin requirements, so using it
   * here matches what mobile shows for pre-trade margin estimates.
   *
   * For limit orders the user-supplied limit price is used instead (that is the expected
   * fill price, making it more accurate than the oracle price for margin on limit orders).
   *
   * Falls back to currentPrice when not yet available.
   */
  markPrice?: number;
  /**
   * Combined fee rate (protocol + MetaMask builder) from usePerpsOrderFees.
   * Includes user-specific volume-tier discounts, referral/staking discounts,
   * HIP-3 multipliers, and MetaMask Rewards discounts.
   *
   * `undefined` while usePerpsOrderFees is loading or in an error state;
   * fee estimates will show $0.00 until a real rate arrives (mobile parity).
   */
  feeRate?: number;
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
 * @param options.initialLeverage
 * @param options.maxLeverage - Maximum leverage for the asset (used in liquidation price formula)
 * @param options.szDecimals - HyperLiquid size decimals (used for position-size rounding in margin calc)
 * @param options.markPrice - Oracle mark price for margin calculation (falls back to currentPrice)
 * @param options.feeRate - Dynamic fee rate from usePerpsOrderFees (falls back to static constant)
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
  initialLeverage,
  maxLeverage = 50,
  szDecimals,
  markPrice,
  feeRate,
}: UsePerpsOrderFormOptions): UsePerpsOrderFormReturn {
  const locale = useSelector(getIntlLocale);
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
      ...(initialLeverage !== undefined && { leverage: initialLeverage }),
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
    initialLeverage: number | undefined;
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
      prev.existingPositionDigest === existingPositionDigest &&
      prev.initialLeverage === initialLeverage
    ) {
      return;
    }

    prevResetDepsRef.current = {
      mode,
      asset,
      initialDirection,
      existingPositionDigest,
      initialLeverage,
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
        ...(initialLeverage !== undefined && { leverage: initialLeverage }),
      });
    }
  }, [mode, asset, initialDirection, initialLeverage]);

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

      const estimatedFees = closeValueUsd * (feeRate ?? 0);

      return {
        positionSize: formatTokenQuantity(closeAmount, asset),
        marginRequired: null, // Not relevant for closing
        liquidationPrice: null, // Not relevant for closing
        liquidationPriceRaw: null,
        orderValue: formatCurrencyWithMinThreshold(closeValueUsd, 'USD'),
        estimatedFees: formatCurrencyWithMinThreshold(estimatedFees, 'USD'),
      };
    }

    // For new/modify modes, calculate based on form amount.
    // Strip commas because amount can be programmatically set via formatNumber
    // (e.g. from slider / token input / percent input) which includes locale
    // grouping separators.
    const amount = Number.parseFloat(formState.amount.replace(/,/gu, '')) || 0;

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
        formState.limitPrice.replace(/,/gu, ''),
      );
      if (Number.isFinite(parsedLimitPrice) && parsedLimitPrice > 0) {
        effectivePrice = parsedLimitPrice;
      }
    }

    // For margin/position-size calculation, prefer the oracle mark price (oraclePx
    // from HyperLiquid's activeAssetCtx) because that is what the exchange uses to
    // assess margin requirements — matching what mobile shows for pre-trade estimates.
    // Limit orders use the limit price (the expected fill price) for accuracy.
    // Falls back to effectivePrice when the oracle price is not yet available.
    const safeMarkPrice =
      markPrice !== undefined && Number.isFinite(markPrice) && markPrice > 0
        ? markPrice
        : undefined;
    const effectiveMarginPrice =
      formState.type === 'limit'
        ? effectivePrice
        : (safeMarkPrice ?? effectivePrice);

    const positionSize = calculatePositionSize(
      amount,
      effectiveMarginPrice,
      szDecimals,
    );
    // Notional is the actual USD value of the rounded position (may differ slightly
    // from the user's input amount due to szDecimals quantisation).
    const notional = positionSize * effectiveMarginPrice;
    // Margin = initial margin only (fees are a separate line item, not added to margin)
    const marginRequired = notional / formState.leverage;
    // Fees are charged on the actual execution notional, matching the close-mode path
    // and the exchange's own calculation.
    const estimatedFees = notional * (feeRate ?? 0);
    const liquidationPriceValue = calculateLiquidationPrice(
      effectiveMarginPrice,
      formState.leverage,
      formState.direction,
      maxLeverage,
    );

    return {
      positionSize: formatTokenQuantity(positionSize, asset),
      marginRequired: formatCurrencyWithMinThreshold(marginRequired, 'USD'),
      liquidationPrice:
        liquidationPriceValue > 0
          ? formatPerpsPrice(liquidationPriceValue, locale)
          : null,
      liquidationPriceRaw: liquidationPriceValue,
      orderValue: formatCurrencyWithMinThreshold(amount, 'USD'),
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
    maxLeverage,
    szDecimals,
    markPrice,
    feeRate,
    locale,
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

  const handleLeverageChange = useCallback(
    (leverage: number) => {
      setFormState((prev) => {
        const amount = parseFloat(prev.amount.replace(/,/gu, '')) || 0;
        const maxSize = availableBalance * leverage;
        const balancePercent =
          maxSize > 0 ? Math.min(Math.round((amount / maxSize) * 100), 100) : 0;
        return { ...prev, leverage, balancePercent };
      });
    },
    [availableBalance],
  );

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
