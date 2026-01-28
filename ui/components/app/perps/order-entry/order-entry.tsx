import React, { useState, useCallback, useMemo } from 'react';
import {
  twMerge,
  Box,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
  ButtonBase,
} from '@metamask/design-system-react';
import {
  Button,
  ButtonVariant,
  ButtonSize,
  TextField,
  TextFieldSize,
} from '../../../component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useFormatters } from '../../../../hooks/useFormatters';

import { DirectionTabs } from './components/direction-tabs';
import { AmountInput } from './components/amount-input';
import { LeverageSlider } from './components/leverage-slider';
import { OrderSummary } from './components/order-summary';
import { AutoCloseSection } from './components/auto-close-section';

import type {
  OrderEntryProps,
  OrderFormState,
  OrderDirection,
} from './order-entry.types';
import type { OrderType } from '../types';
import {
  mockOrderFormDefaults,
  calculatePositionSize,
  calculateMarginRequired,
  estimateLiquidationPrice,
} from './order-entry.mocks';

/**
 * OrderEntry - Main order entry form for Perps trading
 *
 * Allows users to:
 * - Select order direction (Long/Short)
 * - Enter order amount in USD
 * - Adjust leverage
 * - Configure Take Profit / Stop Loss
 * - Submit market or limit orders
 *
 * @param props - Component props
 * @param props.asset - Asset symbol to trade
 * @param props.currentPrice - Current asset price
 * @param props.maxLeverage - Maximum allowed leverage
 * @param props.availableBalance - Available balance for trading
 * @param props.onSubmit - Callback when order is submitted
 */
export const OrderEntry: React.FC<OrderEntryProps> = ({
  asset,
  currentPrice,
  maxLeverage,
  availableBalance,
  initialDirection = 'long',
  onSubmit,
}) => {
  const t = useI18nContext();
  const { formatCurrencyWithMinThreshold } = useFormatters();

  // Form state
  const [formState, setFormState] = useState<OrderFormState>({
    ...mockOrderFormDefaults,
    asset,
    direction: initialDirection,
  });

  // Individual state setters
  const handleDirectionChange = useCallback((direction: OrderDirection) => {
    setFormState((prev) => ({ ...prev, direction }));
  }, []);

  const handleAmountChange = useCallback((amount: string) => {
    setFormState((prev) => ({ ...prev, amount }));
  }, []);

  const handleBalancePercentChange = useCallback((balancePercent: number) => {
    setFormState((prev) => ({ ...prev, balancePercent }));
  }, []);

  const handleLeverageChange = useCallback((leverage: number) => {
    setFormState((prev) => ({ ...prev, leverage }));
  }, []);

  const handleOrderTypeChange = useCallback((type: OrderType) => {
    setFormState((prev) => ({ ...prev, type }));
  }, []);

  const handleLimitPriceChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        setFormState((prev) => ({ ...prev, limitPrice: value }));
      }
    },
    [],
  );

  const handleAutoCloseEnabledChange = useCallback((enabled: boolean) => {
    setFormState((prev) => ({ ...prev, autoCloseEnabled: enabled }));
  }, []);

  const handleTakeProfitPriceChange = useCallback((price: string) => {
    setFormState((prev) => ({ ...prev, takeProfitPrice: price }));
  }, []);

  const handleStopLossPriceChange = useCallback((price: string) => {
    setFormState((prev) => ({ ...prev, stopLossPrice: price }));
  }, []);

  // Calculate derived values
  const calculations = useMemo(() => {
    const amountNum = parseFloat(formState.amount);
    if (isNaN(amountNum) || amountNum === 0) {
      return {
        positionSize: null,
        marginRequired: null,
        liquidationPrice: null,
        orderValue: null,
      };
    }

    const positionSize = calculatePositionSize(amountNum, currentPrice);
    const marginRequired = calculateMarginRequired(
      amountNum,
      formState.leverage,
    );
    const liquidationPrice = estimateLiquidationPrice(
      currentPrice,
      formState.leverage,
      formState.direction === 'long',
    );

    return {
      positionSize: positionSize.toFixed(6),
      marginRequired: formatCurrencyWithMinThreshold(marginRequired, 'USD'),
      liquidationPrice: formatCurrencyWithMinThreshold(
        liquidationPrice,
        'USD',
      ),
      orderValue: formatCurrencyWithMinThreshold(amountNum, 'USD'),
    };
  }, [
    formState.amount,
    formState.leverage,
    formState.direction,
    currentPrice,
    formatCurrencyWithMinThreshold,
  ]);

  // Handle form submission
  const handleSubmit = useCallback(() => {
    onSubmit?.(formState);
  }, [formState, onSubmit]);

  // Determine button text and color based on direction
  const submitButtonText =
    formState.direction === 'long'
      ? t('perpsOpenLong', [asset])
      : t('perpsOpenShort', [asset]);

  const isLong = formState.direction === 'long';

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      gap={4}
      className="w-full"
      data-testid="order-entry"
    >
      {/* Direction Tabs (Long/Short) */}
      <DirectionTabs
        direction={formState.direction}
        onDirectionChange={handleDirectionChange}
      />

      {/* Available Balance Row */}
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
        alignItems={BoxAlignItems.Center}
      >
        <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
          {t('perpsAvailableToTrade')}
        </Text>
        <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
          {formatCurrencyWithMinThreshold(availableBalance, 'USD')}
        </Text>
      </Box>

      {/* Order Type Selector */}
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
        alignItems={BoxAlignItems.Center}
      >
        <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
          {t('perpsOrderType')}
        </Text>
        <ButtonBase
          onClick={() =>
            handleOrderTypeChange(
              formState.type === 'market' ? 'limit' : 'market',
            )
          }
          className="hover:bg-muted-hover active:bg-muted-pressed rounded px-2 py-1"
          data-testid="order-type-selector"
        >
          <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
            {formState.type === 'market' ? t('perpsMarket') : t('perpsLimit')}
          </Text>
        </ButtonBase>
      </Box>

      {/* Limit Price Input (shown only for limit orders) */}
      {formState.type === 'limit' && (
        <TextField
          size={TextFieldSize.Md}
          value={formState.limitPrice}
          onChange={handleLimitPriceChange}
          placeholder={t('perpsLimitPrice')}
          className="w-full"
          startAccessory={
            <Text
              variant={TextVariant.BodyMd}
              color={TextColor.TextAlternative}
              className="pl-2"
            >
              $
            </Text>
          }
          data-testid="limit-price-input"
        />
      )}

      {/* Amount Input with Percentage Slider */}
      <AmountInput
        amount={formState.amount}
        onAmountChange={handleAmountChange}
        balancePercent={formState.balancePercent}
        onBalancePercentChange={handleBalancePercentChange}
        availableBalance={availableBalance}
        leverage={formState.leverage}
      />

      {/* Leverage Slider */}
      <LeverageSlider
        leverage={formState.leverage}
        onLeverageChange={handleLeverageChange}
        maxLeverage={maxLeverage}
      />

      {/* Order Summary (Liquidation Price, Order Value) */}
      <OrderSummary
        liquidationPrice={calculations.liquidationPrice}
        orderValue={calculations.orderValue}
      />

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

      {/* Submit Button */}
      <Button
        variant={ButtonVariant.Primary}
        size={ButtonSize.Lg}
        onClick={handleSubmit}
        className={twMerge(
          'w-full',
          isLong ? 'bg-success-default hover:bg-success-hover' : 'bg-error-default hover:bg-error-hover',
        )}
        data-testid="submit-order-button"
      >
        {submitButtonText}
      </Button>
    </Box>
  );
};

export default OrderEntry;
