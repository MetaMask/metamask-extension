import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { twMerge, Box, BoxFlexDirection } from '@metamask/design-system-react';
import { Button, ButtonVariant, ButtonSize } from '../../../component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useFormatters } from '../../../../hooks/useFormatters';

import type { OrderEntryProps, OrderFormState } from './order-entry.types';
import {
  mockOrderFormDefaults,
  calculatePositionSize,
  calculateMarginRequired,
  estimateLiquidationPrice,
} from './order-entry.mocks';

import { AmountInput } from './components/amount-input';
import { LeverageSlider } from './components/leverage-slider';
import { OrderSummary } from './components/order-summary';
import { AutoCloseSection } from './components/auto-close-section';
import { CloseAmountSection } from './components/close-amount-section';

/**
 * OrderEntry - Main component for creating perps orders
 *
 * This component provides a form interface for users to:
 * - Set order amount (USD)
 * - Adjust leverage
 * - Configure take profit and stop loss (auto-close)
 * - View order summary (liquidation price, order value)
 *
 * Supports three modes:
 * - 'new': Creating a new position (default)
 * - 'modify': Modifying an existing position (pre-populated values)
 * - 'close': Closing an existing position (partial or full)
 *
 * @param props - Component props
 * @param props.asset - Asset symbol to trade
 * @param props.currentPrice - Current asset price in USD
 * @param props.maxLeverage - Maximum leverage allowed for this asset
 * @param props.availableBalance - Available balance for trading
 * @param props.initialDirection - Initial order direction (defaults to 'long')
 * @param props.onSubmit - Callback when order is submitted
 * @param props.onFormStateChange - Callback when form state changes
 * @param props.showSubmitButton - Whether to show the internal submit button
 * @param props.mode - Order mode: 'new', 'modify', or 'close' (defaults to 'new')
 * @param props.existingPosition - Existing position data for pre-population
 */
export const OrderEntry: React.FC<OrderEntryProps> = ({
  asset,
  currentPrice,
  maxLeverage,
  availableBalance,
  initialDirection = 'long',
  onSubmit,
  onFormStateChange,
  showSubmitButton = true,
  mode = 'new',
  existingPosition,
}) => {
  const t = useI18nContext();
  const { formatCurrencyWithMinThreshold, formatTokenQuantity } =
    useFormatters();

  // Close percentage state (for 'close' mode, defaults to 100%)
  const [closePercent, setClosePercent] = useState<number>(100);

  // Initialize form state based on mode
  const [formState, setFormState] = useState<OrderFormState>(() => {
    // For modify mode, pre-populate from existing position
    if (mode === 'modify' && existingPosition) {
      return {
        ...mockOrderFormDefaults,
        asset,
        direction: initialDirection,
        leverage: existingPosition.leverage,
        takeProfitPrice: existingPosition.takeProfitPrice ?? '',
        stopLossPrice: existingPosition.stopLossPrice ?? '',
        autoCloseEnabled: Boolean(
          existingPosition.takeProfitPrice || existingPosition.stopLossPrice,
        ),
      };
    }
    // For new and close modes, use defaults
    return {
      ...mockOrderFormDefaults,
      asset,
      direction: initialDirection,
    };
  });

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
    const cleanAmount = formState.amount.replace(/,/g, '');
    const amount = parseFloat(cleanAmount) || 0;

    if (amount === 0) {
      return {
        positionSize: null,
        marginRequired: null,
        liquidationPrice: null,
        orderValue: null,
        estimatedFees: null,
      };
    }

    const positionSize = calculatePositionSize(amount, currentPrice);
    const marginRequired = calculateMarginRequired(amount, formState.leverage);
    const liquidationPrice = estimateLiquidationPrice(
      currentPrice,
      formState.leverage,
      formState.direction === 'long',
    );
    // Mock fee calculation: 0.05% of order value
    const estimatedFees = amount * 0.0005;

    return {
      positionSize: formatTokenQuantity(positionSize, asset),
      marginRequired: formatCurrencyWithMinThreshold(marginRequired, 'USD'),
      liquidationPrice: formatCurrencyWithMinThreshold(liquidationPrice, 'USD'),
      orderValue: formatCurrencyWithMinThreshold(amount, 'USD'),
      estimatedFees: formatCurrencyWithMinThreshold(estimatedFees, 'USD'),
    };
  }, [formState.amount, formState.leverage, formState.direction, currentPrice, mode, existingPosition, closePercent, asset, formatCurrencyWithMinThreshold, formatTokenQuantity]);

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

  // Submit handler
  const handleSubmit = useCallback(() => {
    onSubmit?.(formState);
  }, [formState, onSubmit]);

  const isLong = formState.direction === 'long';

  // Determine submit button text based on mode
  const submitButtonText = useMemo(() => {
    switch (mode) {
      case 'modify':
        return t('perpsModifyPosition');
      case 'close':
        return isLong ? t('perpsConfirmCloseLong') : t('perpsConfirmCloseShort');
      default:
        return isLong ? t('perpsOpenLong', [asset]) : t('perpsOpenShort', [asset]);
    }
  }, [mode, isLong, asset, t]);

  // Get position size for close mode
  const positionSize = existingPosition?.size ?? '0';

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      className="w-full h-full overflow-x-hidden"
      data-testid="order-entry"
    >
      {/* Scrollable Form Content */}
      <Box
        flexDirection={BoxFlexDirection.Column}
        gap={4}
        className="flex-1 overflow-y-auto overflow-x-hidden pb-4"
      >
        {/* Close Mode: Show CloseAmountSection */}
        {mode === 'close' && existingPosition && (
          <CloseAmountSection
            positionSize={positionSize}
            closePercent={closePercent}
            onClosePercentChange={handleClosePercentChange}
            asset={asset}
            currentPrice={currentPrice}
          />
        )}

        {/* New/Modify Modes: Show Amount Input Section */}
        {mode !== 'close' && (
          <AmountInput
            amount={formState.amount}
            onAmountChange={handleAmountChange}
            balancePercent={formState.balancePercent}
            onBalancePercentChange={handleBalancePercentChange}
            availableBalance={availableBalance}
            leverage={formState.leverage}
            asset={asset}
            currentPrice={currentPrice}
          />
        )}

        {/* New/Modify Modes: Show Leverage Slider Section */}
        {mode !== 'close' && (
          <LeverageSlider
            leverage={formState.leverage}
            onLeverageChange={handleLeverageChange}
            maxLeverage={maxLeverage}
          />
        )}

        {/* Order Summary Section - shown in all modes */}
        <Box
          className="bg-muted rounded-lg"
          paddingLeft={3}
          paddingRight={3}
          paddingTop={3}
          paddingBottom={3}
        >
          <OrderSummary
            marginRequired={calculations.marginRequired}
            estimatedFees={calculations.estimatedFees}
            liquidationPrice={calculations.liquidationPrice}
          />
        </Box>

        {/* New/Modify Modes: Show Auto Close (TP/SL) Section */}
        {mode !== 'close' && (
          <AutoCloseSection
            enabled={formState.autoCloseEnabled}
            onEnabledChange={handleAutoCloseEnabledChange}
            takeProfitPrice={formState.takeProfitPrice}
            onTakeProfitPriceChange={handleTakeProfitPriceChange}
            stopLossPrice={formState.stopLossPrice}
            onStopLossPriceChange={handleStopLossPriceChange}
            direction={formState.direction}
            currentPrice={currentPrice}
          />
        )}
      </Box>

      {/* Submit Button - shown only when showSubmitButton is true */}
      {showSubmitButton && (
        <Box
          className="sticky bottom-0 left-0 right-0 bg-default border-t border-muted"
          paddingTop={3}
          paddingBottom={4}
        >
          <Button
            variant={ButtonVariant.Primary}
            size={ButtonSize.Lg}
            onClick={handleSubmit}
            className={twMerge(
              'w-full',
              isLong
                ? 'bg-success-default hover:bg-success-hover active:bg-success-pressed'
                : 'bg-error-default hover:bg-error-hover active:bg-error-pressed',
            )}
            data-testid="order-entry-submit-button"
          >
            {submitButtonText}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default OrderEntry;
