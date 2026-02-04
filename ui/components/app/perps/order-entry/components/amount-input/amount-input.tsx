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
import { TextField, TextFieldSize } from '../../../../../component-library';
import {
  BorderRadius,
  BackgroundColor,
} from '../../../../../../helpers/constants/design-system';
import { PerpsSlider } from '../../../perps-slider';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { useFormatters } from '../../../../../../hooks/useFormatters';
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
  const { formatCurrencyWithMinThreshold, formatTokenQuantity, formatNumber } =
    useFormatters();

  // Calculate token conversion based on leveraged position size
  const tokenAmount = useMemo(() => {
    // Remove commas from formatted amount for parsing
    const cleanAmount = amount.replace(/,/gu, '');
    const numAmount = parseFloat(cleanAmount) || 0;
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
      const { value } = event.target;
      // Allow empty string, valid numbers, or numbers with commas (for formatted input)
      if (value === '' || /^[\d,]*\.?\d*$/u.test(value)) {
        onAmountChange(value);

        // Update percentage based on amount relative to available balance
        // Remove commas for parsing
        const cleanValue = value.replace(/,/gu, '');
        if (cleanValue && availableBalance > 0) {
          const numValue = parseFloat(cleanValue);
          // Guard against NaN (e.g., lone decimal point ".")
          if (!isNaN(numValue) && numValue > 0) {
            const percent = Math.min((numValue / availableBalance) * 100, 100);
            onBalancePercentChange(Math.round(percent));
          } else {
            onBalancePercentChange(0);
          }
        } else {
          onBalancePercentChange(0);
        }
      }
    },
    [onAmountChange, onBalancePercentChange, availableBalance],
  );

  // Format amount for display (with locale-aware formatting)
  const formatAmount = useCallback(
    (value: number): string => {
      return formatNumber(value, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    },
    [formatNumber],
  );

  // Formatted placeholder for the amount input
  const formattedPlaceholder = useMemo(() => formatAmount(0), [formatAmount]);

  // Handle percentage preset button click
  const handlePercentClick = useCallback(
    (percent: number) => {
      onBalancePercentChange(percent);
      if (percent === 0) {
        onAmountChange('');
      } else {
        // Calculate amount as percentage of available balance
        const newAmount = (availableBalance * percent) / 100;
        onAmountChange(formatAmount(newAmount));
      }
    },
    [onAmountChange, onBalancePercentChange, availableBalance, formatAmount],
  );

  // Handle blur - format the amount when user finishes typing
  const handleAmountBlur = useCallback(() => {
    if (amount) {
      const numValue = parseFloat(amount.replace(/,/gu, ''));
      if (!isNaN(numValue) && numValue > 0) {
        onAmountChange(formatAmount(numValue));
      }
    }
  }, [amount, onAmountChange, formatAmount]);

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
            {formatCurrencyWithMinThreshold(availableBalance, 'USD')}
          </Text>
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            {formatCurrencyWithMinThreshold(availableBalance, 'USD')}{' '}
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
            <TextField
              size={TextFieldSize.Lg}
              value={amount}
              onChange={handleAmountChange}
              onBlur={handleAmountBlur}
              placeholder={formattedPlaceholder}
              borderRadius={BorderRadius.none}
              borderWidth={0}
              backgroundColor={BackgroundColor.transparent}
              startAccessory={
                <Text
                  variant={TextVariant.HeadingLg}
                  fontWeight={FontWeight.Bold}
                >
                  $
                </Text>
              }
              inputProps={{
                inputMode: 'decimal',
                style: {
                  fontSize: '24px',
                  lineHeight: '32px',
                  fontWeight: 700,
                },
              }}
              className="w-full"
              data-testid="amount-input-field"
            />

            {/* Token Conversion */}
            <Box paddingLeft={4}>
              <Text
                variant={TextVariant.BodySm}
                color={
                  tokenAmount !== null && tokenAmount !== 0
                    ? TextColor.TextAlternative
                    : TextColor.TextMuted
                }
              >
                {tokenAmount !== null && tokenAmount !== 0
                  ? `≈ ${formatTokenQuantity(tokenAmount, asset)}`
                  : `0 ${asset}`}
              </Text>
            </Box>
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
                  ? 'bg-muted text-primary-inverse'
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
