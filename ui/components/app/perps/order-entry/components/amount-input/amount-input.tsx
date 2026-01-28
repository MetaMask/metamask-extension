import React, { useCallback, useMemo } from 'react';
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
import Slider from '../../../../../ui/slider';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import type { AmountInputProps } from '../../order-entry.types';
import {
  BALANCE_PERCENT_PRESETS,
  calculateMaxAmount,
  calculatePositionSize,
} from '../../order-entry.mocks';

/**
 * AmountInput - USD amount input with percentage slider and token conversion
 *
 * @param props - Component props
 * @param props.amount - Current amount value
 * @param props.onAmountChange - Callback when amount changes
 * @param props.balancePercent - Current balance percentage (0-100)
 * @param props.onBalancePercentChange - Callback when percentage changes
 * @param props.availableBalance - Available balance for calculations
 * @param props.leverage - Current leverage multiplier
 * @param props.asset - Asset symbol for token conversion
 * @param props.currentPrice - Current asset price for conversion
 */
export const AmountInput: React.FC<AmountInputProps> = ({
  amount,
  onAmountChange,
  balancePercent,
  onBalancePercentChange,
  availableBalance,
  leverage,
  asset,
  currentPrice,
}) => {
  const t = useI18nContext();

  // Calculate max amount based on available balance and leverage
  const maxAmount = useMemo(
    () => calculateMaxAmount(availableBalance, leverage),
    [availableBalance, leverage],
  );

  // Calculate token conversion
  const tokenAmount = useMemo(() => {
    const numAmount = parseFloat(amount) || 0;
    if (numAmount === 0 || currentPrice === 0) {
      return null;
    }
    return calculatePositionSize(numAmount, currentPrice);
  }, [amount, currentPrice]);

  // Handle direct amount input
  const handleAmountChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      // Allow empty string or valid numbers
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        onAmountChange(value);

        // Update percentage based on amount
        if (value && maxAmount > 0) {
          const numValue = parseFloat(value);
          const percent = Math.min((numValue / maxAmount) * 100, 100);
          onBalancePercentChange(Math.round(percent));
        } else {
          onBalancePercentChange(0);
        }
      }
    },
    [onAmountChange, onBalancePercentChange, maxAmount],
  );

  // Handle percentage preset button click
  const handlePercentClick = useCallback(
    (percent: number) => {
      onBalancePercentChange(percent);
      if (percent === 0) {
        onAmountChange('');
      } else {
        const newAmount = (maxAmount * percent) / 100;
        onAmountChange(newAmount.toFixed(2));
      }
    },
    [onAmountChange, onBalancePercentChange, maxAmount],
  );

  // Handle slider change
  const handleSliderChange = useCallback(
    (_event: React.ChangeEvent<unknown>, value: number | number[]) => {
      const percent = Array.isArray(value) ? value[0] : value;
      handlePercentClick(percent);
    },
    [handlePercentClick],
  );

  return (
    <Box flexDirection={BoxFlexDirection.Column} gap={3}>
      {/* Available to Trade */}
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
        alignItems={BoxAlignItems.Center}
      >
        <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
          {t('perpsAvailableToTrade')}
        </Text>
        <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
          ${availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
      </Box>

      {/* Order Amount Section */}
      <Box
        className="bg-muted rounded-xl"
        paddingLeft={4}
        paddingRight={4}
        paddingTop={4}
        paddingBottom={4}
      >
        <Box flexDirection={BoxFlexDirection.Column} gap={1}>
          {/* Label */}
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            {t('perpsOrderAmount')}
          </Text>

          {/* USD Amount Input - Large and prominent */}
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
          >
            <Text
              variant={TextVariant.HeadingLg}
              fontWeight={FontWeight.Medium}
              color={TextColor.TextAlternative}
            >
              $
            </Text>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={handleAmountChange}
              placeholder="0.00"
              className={twMerge(
                'flex-1 bg-transparent border-none outline-none',
                'text-3xl font-medium text-default',
                'placeholder:text-muted',
              )}
              data-testid="amount-input-field"
            />
          </Box>

          {/* Token Conversion */}
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            {tokenAmount !== null
              ? `≈ ${tokenAmount.toFixed(6)} ${asset}`
              : `0 ${asset}`}
          </Text>
        </Box>
      </Box>

      {/* Percentage Slider */}
      <Box flexDirection={BoxFlexDirection.Column} gap={2}>
        <Box className="px-1" data-testid="amount-slider">
          <Slider
            min={0}
            max={100}
            step={1}
            value={balancePercent}
            onChange={handleSliderChange}
          />
        </Box>

        {/* Percentage Preset Buttons */}
        <Box
          flexDirection={BoxFlexDirection.Row}
          justifyContent={BoxJustifyContent.Between}
          alignItems={BoxAlignItems.Center}
          className="w-full"
        >
          {BALANCE_PERCENT_PRESETS.map((preset) => (
            <ButtonBase
              key={preset}
              onClick={() => handlePercentClick(preset)}
              className={twMerge(
                'px-3 py-1 rounded-md text-sm',
                balancePercent === preset
                  ? 'bg-primary-muted text-primary-default'
                  : 'bg-transparent text-muted hover:bg-muted-hover',
              )}
              data-testid={`percent-preset-${preset}`}
            >
              {preset}%
            </ButtonBase>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default AmountInput;
