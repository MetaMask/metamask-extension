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
import { PerpsSlider } from '../../../perps-slider';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import type { AmountInputProps } from '../../order-entry.types';
import {
  BALANCE_PERCENT_PRESETS,
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

  // Calculate token conversion based on leveraged position size
  const tokenAmount = useMemo(() => {
    const numAmount = parseFloat(amount) || 0;
    if (numAmount === 0 || currentPrice === 0) {
      return null;
    }
    // Position size = margin amount * leverage
    const positionValue = numAmount * leverage;
    return calculatePositionSize(positionValue, currentPrice);
  }, [amount, currentPrice, leverage]);

  // Handle direct amount input
  const handleAmountChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      // Allow empty string or valid numbers
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        onAmountChange(value);

        // Update percentage based on amount relative to available balance
        if (value && availableBalance > 0) {
          const numValue = parseFloat(value);
          const percent = Math.min((numValue / availableBalance) * 100, 100);
          onBalancePercentChange(Math.round(percent));
        } else {
          onBalancePercentChange(0);
        }
      }
    },
    [onAmountChange, onBalancePercentChange, availableBalance],
  );

  // Handle percentage preset button click
  const handlePercentClick = useCallback(
    (percent: number) => {
      onBalancePercentChange(percent);
      if (percent === 0) {
        onAmountChange('');
      } else {
        // Calculate amount as percentage of available balance
        const newAmount = (availableBalance * percent) / 100;
        onAmountChange(newAmount.toFixed(2));
      }
    },
    [onAmountChange, onBalancePercentChange, availableBalance],
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
    <Box flexDirection={BoxFlexDirection.Column} gap={5}>
      {/* Balance Section */}
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
        alignItems={BoxAlignItems.Center}
      >
        {/* Left: Balance and Available text */}
        <Box flexDirection={BoxFlexDirection.Column} gap={1}>
          <Text variant={TextVariant.HeadingLg} fontWeight={FontWeight.Bold}>
            $
            {availableBalance.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            $
            {availableBalance.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{' '}
            {t('perpsAvailable').toLowerCase()}
          </Text>
        </Box>

        {/* Right: Add Funds Button */}
        <ButtonBase
          className={twMerge(
            'px-4 py-2 rounded-lg',
            'bg-muted hover:bg-hover active:bg-pressed',
          )}
          data-testid="add-funds-button"
        >
          <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
            {t('perpsAddFunds')}
          </Text>
        </ButtonBase>
      </Box>

      {/* Order Amount Section */}
      <Box flexDirection={BoxFlexDirection.Column} gap={2}>
        {/* Section Header */}
        <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
          {t('perpsOrderAmount')}
        </Text>

        {/* Order Input Box */}
        <Box
          className="bg-muted rounded-xl"
          paddingLeft={4}
          paddingRight={4}
          paddingTop={4}
          paddingBottom={4}
        >
          <Box flexDirection={BoxFlexDirection.Column} gap={1}>
            {/* USD Amount Input - Large and prominent */}
            <Box
              flexDirection={BoxFlexDirection.Row}
              alignItems={BoxAlignItems.Baseline}
            >
              <span className="text-[24px] leading-8 font-bold text-default">
                $
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0.00"
                className={twMerge(
                  'flex-1 bg-transparent border-none outline-none',
                  'text-[24px] leading-8 font-bold text-default',
                  'placeholder:text-muted',
                )}
                data-testid="amount-input-field"
              />
            </Box>

            {/* Token Conversion */}
            <Text
              variant={TextVariant.BodySm}
              color={TextColor.TextAlternative}
            >
              {tokenAmount !== null
                ? `≈ ${tokenAmount.toFixed(6)} ${asset}`
                : `0 ${asset}`}
            </Text>
          </Box>
        </Box>
      </Box>

      {/* Percentage Slider */}
      <Box flexDirection={BoxFlexDirection.Column} gap={2}>
        <Box className="px-3" data-testid="amount-slider">
          <PerpsSlider
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
                  ? 'bg-muted text-[#FFFFFF]'
                  : 'bg-transparent text-muted hover:bg-hover',
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
