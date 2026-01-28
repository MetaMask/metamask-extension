import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { twMerge, Box, BoxFlexDirection } from '@metamask/design-system-react';
import { Button, ButtonVariant, ButtonSize } from '../../../component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';

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

/**
 * OrderEntry - Main component for creating perps orders
 *
 * This component provides a form interface for users to:
 * - Set order amount (USD)
 * - Adjust leverage
 * - Configure take profit and stop loss (auto-close)
 * - View order summary (liquidation price, order value)
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
}) => {
  const t = useI18nContext();

  // Initialize form state
  const [formState, setFormState] = useState<OrderFormState>(() => ({
    ...mockOrderFormDefaults,
    asset,
    direction: initialDirection,
  }));

  // Notify parent of form state changes
  useEffect(() => {
    onFormStateChange?.(formState);
  }, [formState, onFormStateChange]);

  // Calculate derived values
  const calculations = useMemo(() => {
    const amount = parseFloat(formState.amount) || 0;

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
      positionSize: positionSize.toFixed(6),
      marginRequired: `$${marginRequired.toFixed(2)}`,
      liquidationPrice: `$${liquidationPrice.toFixed(2)}`,
      orderValue: `$${amount.toFixed(2)}`,
      estimatedFees: `$${estimatedFees.toFixed(2)}`,
    };
  }, [formState.amount, formState.leverage, formState.direction, currentPrice]);

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

  // Submit handler
  const handleSubmit = useCallback(() => {
    onSubmit?.(formState);
  }, [formState, onSubmit]);

  const isLong = formState.direction === 'long';
  const submitButtonText = isLong
    ? t('perpsOpenLong', [asset])
    : t('perpsOpenShort', [asset]);

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
        {/* Amount Input Section */}
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

        {/* Leverage Slider Section */}
        <LeverageSlider
          leverage={formState.leverage}
          onLeverageChange={handleLeverageChange}
          maxLeverage={maxLeverage}
        />

        {/* Order Summary Section */}
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

        {/* Auto Close (TP/SL) Section */}
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
