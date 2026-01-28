import React, { useCallback, useMemo } from 'react';
import {
  twMerge,
  Box,
  Text,
  TextVariant,
  TextColor,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
  ButtonBase,
} from '@metamask/design-system-react';
import { TextField, TextFieldSize } from '../../../../../component-library';
import type { AmountInputProps } from '../../order-entry.types';
import {
  BALANCE_PERCENT_PRESETS,
  calculateMaxAmount,
} from '../../order-entry.mocks';

/**
 * AmountInput - USD amount input with percentage slider
 *
 * @param props - Component props
 * @param props.amount - Current amount value
 * @param props.onAmountChange - Callback when amount changes
 * @param props.balancePercent - Current balance percentage (0-100)
 * @param props.onBalancePercentChange - Callback when percentage changes
 * @param props.availableBalance - Available balance for calculations
 * @param props.leverage - Current leverage multiplier
 */
export const AmountInput: React.FC<AmountInputProps> = ({
  amount,
  onAmountChange,
  balancePercent,
  onBalancePercentChange,
  availableBalance,
  leverage,
}) => {
  // Calculate max amount based on available balance and leverage
  const maxAmount = useMemo(
    () => calculateMaxAmount(availableBalance, leverage),
    [availableBalance, leverage],
  );

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
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const percent = parseInt(event.target.value, 10);
      handlePercentClick(percent);
    },
    [handlePercentClick],
  );

  return (
    <Box flexDirection={BoxFlexDirection.Column} gap={3}>
      {/* Amount Input Field */}
      <Box className="w-full">
        <TextField
          size={TextFieldSize.Lg}
          value={amount}
          onChange={handleAmountChange}
          placeholder="0"
          className="w-full"
          startAccessory={
            <Text
              variant={TextVariant.BodyLg}
              color={TextColor.TextAlternative}
              className="pl-2"
            >
              $
            </Text>
          }
          data-testid="amount-input-field"
        />
      </Box>

      {/* Percentage Slider */}
      <Box flexDirection={BoxFlexDirection.Column} gap={2}>
        <Box className="relative w-full px-2">
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={balancePercent}
            onChange={handleSliderChange}
            className={twMerge(
              'w-full h-1 bg-muted rounded-full appearance-none cursor-pointer',
              '[&::-webkit-slider-thumb]:appearance-none',
              '[&::-webkit-slider-thumb]:w-4',
              '[&::-webkit-slider-thumb]:h-4',
              '[&::-webkit-slider-thumb]:bg-default',
              '[&::-webkit-slider-thumb]:border-2',
              '[&::-webkit-slider-thumb]:border-primary-default',
              '[&::-webkit-slider-thumb]:rounded-full',
              '[&::-webkit-slider-thumb]:cursor-pointer',
            )}
            data-testid="amount-slider"
          />
          {/* Dot markers */}
          <Box
            flexDirection={BoxFlexDirection.Row}
            justifyContent={BoxJustifyContent.Between}
            className="absolute top-0 left-2 right-2 pointer-events-none"
          >
            {BALANCE_PERCENT_PRESETS.map((preset) => (
              <Box
                key={preset}
                className={twMerge(
                  'w-1.5 h-1.5 rounded-full -mt-0.5',
                  balancePercent >= preset ? 'bg-primary-default' : 'bg-muted',
                )}
              />
            ))}
          </Box>
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

      {/* Current Percentage Badge */}
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.End}
      >
        <Box className="bg-muted px-3 py-1 rounded-md">
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            {balancePercent} %
          </Text>
        </Box>
      </Box>
    </Box>
  );
};

export default AmountInput;
