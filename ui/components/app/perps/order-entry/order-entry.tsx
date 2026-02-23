import React, { useMemo } from 'react';
import {
  twMerge,
  Box,
  BoxFlexDirection,
  Button,
  ButtonVariant,
  ButtonSize,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';

import { usePerpsOrderForm } from '../../../../hooks/perps';
import type { OrderEntryProps } from './order-entry.types';

import { AmountInput } from './components/amount-input';
import { LimitPriceInput } from './components/limit-price-input';
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
 * @param props.orderType
 * @param props.midPrice
 * @param props.bidPrice
 * @param props.askPrice
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
  orderType = 'market',
  midPrice,
  bidPrice,
  askPrice,
}) => {
  const t = useI18nContext();

  // Use custom hook for form state management
  const {
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
    handleSubmit,
  } = usePerpsOrderForm({
    asset,
    currentPrice,
    initialDirection,
    mode,
    existingPosition,
    onFormStateChange,
    onSubmit,
    orderType,
  });

  const isLong = formState.direction === 'long';

  // Determine submit button text based on mode
  const submitButtonText = useMemo(() => {
    switch (mode) {
      case 'modify':
        return t('perpsModifyPosition');
      case 'close':
        return isLong
          ? t('perpsConfirmCloseLong')
          : t('perpsConfirmCloseShort');
      default:
        return isLong
          ? t('perpsOpenLong', [asset])
          : t('perpsOpenShort', [asset]);
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

        {/* Limit Orders: Show Limit Price Input below Order Amount */}
        {mode !== 'close' && formState.type === 'limit' && (
          <LimitPriceInput
            limitPrice={formState.limitPrice}
            onLimitPriceChange={handleLimitPriceChange}
            currentPrice={currentPrice}
            direction={formState.direction}
            midPrice={midPrice}
            bidPrice={bidPrice}
            askPrice={askPrice}
          />
        )}

        {/* New/Modify Modes: Show Leverage Slider Section */}
        {mode !== 'close' && (
          <LeverageSlider
            leverage={formState.leverage}
            onLeverageChange={handleLeverageChange}
            maxLeverage={maxLeverage}
            minLeverage={
              mode === 'modify' && existingPosition
                ? existingPosition.leverage
                : undefined
            }
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
            entryPrice={
              mode === 'modify' && existingPosition?.entryPrice
                ? (() => {
                    const p = parseFloat(
                      existingPosition.entryPrice.replace(/,/gu, ''),
                    );
                    return Number.isNaN(p) ? undefined : p;
                  })()
                : undefined
            }
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
