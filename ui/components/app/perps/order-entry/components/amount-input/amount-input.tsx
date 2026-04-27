import {
  Box,
  Text,
  TextVariant,
  TextColor,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
  Icon,
  IconName,
  IconSize,
  IconColor,
} from '@metamask/design-system-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
  BorderRadius,
  BackgroundColor,
} from '../../../../../../helpers/constants/design-system';
import { useFormatters } from '../../../../../../hooks/useFormatters';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { TextField, TextFieldSize } from '../../../../../component-library';
import { PerpsSlider } from '../../../perps-slider';
import { getDisplaySymbol } from '../../../utils';
import type { AmountInputProps } from '../../order-entry.types';
import {
  formatNumberForInput,
  isDigitsOnlyInput,
  isUnsignedDecimalInput,
} from '../../utils';

/**
 * AmountInput - Size section with dual USD/token inputs and percentage slider
 *
 * Compact layout: "Size" label + "Available to trade XX USDC", two side-by-side
 * inputs (USD and token), slider with percentage pill. No preset buttons.
 * @param options0
 * @param options0.amount
 * @param options0.onAmountChange
 * @param options0.balancePercent
 * @param options0.onBalancePercentChange
 * @param options0.availableBalance
 * @param options0.leverage
 * @param options0.asset
 * @param options0.currentPrice
 * @param options0.onAddFunds
 * @param options0.szDecimals
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
  szDecimals,
  onAddFunds,
}) => {
  const t = useI18nContext();
  const { formatCurrencyWithMinThreshold, formatNumber } = useFormatters();
  const [percentInputValue, setPercentInputValue] = useState<string>(
    String(balancePercent),
  );

  useEffect(() => {
    setPercentInputValue(String(balancePercent));
  }, [balancePercent]);

  const tokenAmount = useMemo(() => {
    const numAmount = Number.parseFloat(amount.replace(/,/gu, '')) || 0;
    if (numAmount === 0 || currentPrice === 0) {
      return null;
    }
    return currentPrice > 0 ? numAmount / currentPrice : null;
  }, [amount, currentPrice]);

  // Uses a locale-neutral formatter (always ".") so the value is always
  // editable by isUnsignedDecimalInput regardless of the user's locale.
  // Cap the max fractional digits to the asset's szDecimals so PUMP shows
  // integer token counts ("6081") and ETH stops at 4 decimals instead of the
  // previous hard-coded 6 (matches mobile's formatPositionSize behaviour).
  const unGroupedTokenDisplay = useMemo(() => {
    if (tokenAmount === null || tokenAmount === 0) {
      return '';
    }
    return formatNumberForInput(tokenAmount, szDecimals);
  }, [tokenAmount, szDecimals]);

  // Local draft for the token input so intermediate values (e.g. "0", "0.") are
  // preserved while the user is actively typing.
  const [isEditingToken, setIsEditingToken] = useState(false);
  const [tokenInputValue, setTokenInputValue] = useState(unGroupedTokenDisplay);

  // When not editing, derive the displayed token value from the current amount
  // rather than syncing via an effect — avoids a stale intermediate render.
  const displayedTokenValue = isEditingToken
    ? tokenInputValue
    : unGroupedTokenDisplay;

  const formatAmount = useCallback(
    (value: number): string => value.toFixed(2),
    [],
  );

  const handleAmountChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      if (!(value === '' || isUnsignedDecimalInput(value))) {
        return;
      }

      onAmountChange(value);

      const maxSize = availableBalance * leverage;
      if (value && maxSize > 0) {
        const numValue = Number.parseFloat(value);
        if (!Number.isNaN(numValue) && numValue > 0) {
          const pct = Math.min(Math.round((numValue / maxSize) * 100), 100);
          onBalancePercentChange(pct);
          setPercentInputValue(String(pct));
        } else {
          onBalancePercentChange(0);
          setPercentInputValue('0');
        }
      } else {
        onBalancePercentChange(0);
        setPercentInputValue('0');
      }
    },
    [onAmountChange, onBalancePercentChange, availableBalance, leverage],
  );

  const handleAmountBlur = useCallback(() => {
    if (!amount) {
      onAmountChange('');
      return;
    }

    const numValue = Number.parseFloat(amount.replace(/,/gu, ''));
    if (Number.isFinite(numValue) && numValue > 0) {
      onAmountChange(numValue.toFixed(2));
      return;
    }

    onAmountChange('');
  }, [amount, onAmountChange]);

  const handleTokenAmountChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      if (value !== '' && !isUnsignedDecimalInput(value)) {
        return;
      }

      // Always update the local draft so partial inputs like "0", "0.", "0.0"
      // are preserved in the field while the user is still typing.
      setTokenInputValue(value);

      if (value === '' || value === '.') {
        onAmountChange('');
        onBalancePercentChange(0);
        setPercentInputValue('0');
        return;
      }
      const numToken = parseFloat(value);
      if (!Number.isFinite(numToken) || numToken <= 0 || currentPrice === 0) {
        onAmountChange('');
        onBalancePercentChange(0);
        setPercentInputValue('0');
        return;
      }
      const usdSize = numToken * currentPrice;
      onAmountChange(formatAmount(usdSize));
      const maxSize = availableBalance * leverage;
      if (maxSize > 0) {
        const pct = Math.min(Math.round((usdSize / maxSize) * 100), 100);
        onBalancePercentChange(pct);
        setPercentInputValue(String(pct));
      } else {
        onBalancePercentChange(0);
        setPercentInputValue('0');
      }
    },
    [
      currentPrice,
      leverage,
      availableBalance,
      onAmountChange,
      onBalancePercentChange,
      formatAmount,
    ],
  );

  const handleTokenFocus = useCallback(() => {
    setTokenInputValue(unGroupedTokenDisplay);
    setIsEditingToken(true);
  }, [unGroupedTokenDisplay]);

  const handleTokenBlur = useCallback(() => {
    setIsEditingToken(false);
  }, []);

  const handleSliderChange = useCallback(
    (_event: React.ChangeEvent<unknown>, value: number | number[]) => {
      const percent = Array.isArray(value) ? value[0] : value;
      onBalancePercentChange(percent);
      setPercentInputValue(String(percent));
      if (percent === 0) {
        onAmountChange('');
      } else {
        const maxSize = availableBalance * leverage;
        const newAmount = (maxSize * percent) / 100;
        onAmountChange(formatAmount(newAmount));
      }
    },
    [
      onAmountChange,
      onBalancePercentChange,
      availableBalance,
      leverage,
      formatAmount,
    ],
  );

  const handlePercentInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      if (value === '' || isDigitsOnlyInput(value)) {
        setPercentInputValue(value);
        const num = parseInt(value, 10);
        if (!isNaN(num) && num >= 0 && num <= 100) {
          onBalancePercentChange(num);
          if (num === 0) {
            onAmountChange('');
          } else {
            const maxSize = availableBalance * leverage;
            const newAmount = (maxSize * num) / 100;
            onAmountChange(formatAmount(newAmount));
          }
        }
      }
    },
    [
      onAmountChange,
      onBalancePercentChange,
      availableBalance,
      leverage,
      formatAmount,
    ],
  );

  const handlePercentInputBlur = useCallback(() => {
    const num = parseInt(percentInputValue, 10);
    if (isNaN(num) || num < 0) {
      onBalancePercentChange(0);
      setPercentInputValue('0');
      onAmountChange('');
    } else if (num > 100) {
      onBalancePercentChange(100);
      setPercentInputValue('100');
      onAmountChange(formatAmount(availableBalance * leverage));
    } else {
      onBalancePercentChange(num);
      setPercentInputValue(String(num));
    }
  }, [
    percentInputValue,
    onAmountChange,
    onBalancePercentChange,
    availableBalance,
    leverage,
    formatAmount,
  ]);

  return (
    <Box flexDirection={BoxFlexDirection.Column} gap={3}>
      {/* Available to trade row */}
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
        alignItems={BoxAlignItems.Center}
      >
        <Text variant={TextVariant.BodySm}>{t('perpsAvailableToTrade')}</Text>
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={2}
        >
          <Text variant={TextVariant.BodySm}>
            {`${formatNumber(availableBalance, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC`}
          </Text>
          <Icon
            name={IconName.AddCircle}
            size={IconSize.Sm}
            color={IconColor.IconAlternative}
            aria-label="Add Funds"
            onClick={onAddFunds}
            className="bg-transparent border-0 p-0 cursor-pointer flex items-center"
            data-testid="amount-input-add-funds"
          />
        </Box>
      </Box>

      {/* Size label */}
      <Text variant={TextVariant.BodySm}>{t('perpsSize')}</Text>

      {/* Two side-by-side inputs: USD (left), Token (right) */}
      <Box
        flexDirection={BoxFlexDirection.Row}
        gap={2}
        alignItems={BoxAlignItems.Center}
      >
        <Box className="flex-1 min-w-0">
          <TextField
            size={TextFieldSize.Md}
            value={amount}
            onChange={handleAmountChange}
            onBlur={handleAmountBlur}
            placeholder="0.00"
            borderRadius={BorderRadius.MD}
            borderWidth={0}
            backgroundColor={BackgroundColor.backgroundMuted}
            className="w-full"
            data-testid="amount-input-field"
            inputProps={{ inputMode: 'decimal' }}
            startAccessory={
              <Text
                variant={TextVariant.BodyMd}
                color={TextColor.TextAlternative}
              >
                $
              </Text>
            }
          />
        </Box>
        <Box className="flex-1 min-w-0">
          <TextField
            size={TextFieldSize.Md}
            value={displayedTokenValue}
            onChange={handleTokenAmountChange}
            onFocus={handleTokenFocus}
            onBlur={handleTokenBlur}
            placeholder="0"
            borderRadius={BorderRadius.MD}
            borderWidth={0}
            backgroundColor={BackgroundColor.backgroundMuted}
            className="w-full"
            data-testid="amount-input-token-field"
            inputProps={{ inputMode: 'decimal' }}
            endAccessory={
              <Text
                variant={TextVariant.BodyMd}
                color={TextColor.TextAlternative}
              >
                {getDisplaySymbol(asset)}
              </Text>
            }
          />
        </Box>
      </Box>

      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        gap={2}
      >
        <Box className="flex-1 px-3" data-testid="amount-slider">
          <PerpsSlider
            min={0}
            max={100}
            step={1}
            value={balancePercent}
            onChange={handleSliderChange}
          />
        </Box>
        <Box className="shrink-0 w-20">
          <TextField
            size={TextFieldSize.Sm}
            value={percentInputValue}
            onChange={handlePercentInputChange}
            onBlur={handlePercentInputBlur}
            borderRadius={BorderRadius.MD}
            borderWidth={0}
            backgroundColor={BackgroundColor.backgroundMuted}
            className="w-full"
            data-testid="balance-percent-input"
            inputProps={{
              inputMode: 'numeric',
              style: { textAlign: 'center' },
            }}
            endAccessory={
              <Text
                variant={TextVariant.BodySm}
                color={TextColor.TextAlternative}
              >
                %
              </Text>
            }
          />
        </Box>
      </Box>
    </Box>
  );
};

export default AmountInput;
