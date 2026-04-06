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
import type { AmountInputProps } from '../../order-entry.types';
import { isDigitsOnlyInput, isUnsignedDecimalInput } from '../../utils';

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
    const numAmount = Number.parseFloat(amount) || 0;
    if (numAmount === 0 || currentPrice === 0) {
      return null;
    }
    const positionValue = numAmount * leverage;
    return currentPrice > 0 ? positionValue / currentPrice : null;
  }, [amount, currentPrice, leverage]);

  const tokenDisplayValue = useMemo(() => {
    if (tokenAmount === null || tokenAmount === 0) {
      return '';
    }
    return formatNumber(tokenAmount, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 6,
    });
  }, [tokenAmount, formatNumber]);

  const handleAmountChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      if (!(value === '' || isUnsignedDecimalInput(value))) {
        return;
      }

      onAmountChange(value);

      if (value && availableBalance > 0) {
        const numValue = Number.parseFloat(value);
        if (!Number.isNaN(numValue) && numValue > 0) {
          const pct = Math.min(
            Math.round((numValue / availableBalance) * 100),
            100,
          );
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
    [availableBalance, onAmountChange, onBalancePercentChange],
  );

  const handleAmountBlur = useCallback(() => {
    if (!amount) {
      onAmountChange('');
      return;
    }

    const numValue = Number.parseFloat(amount);
    if (Number.isFinite(numValue) && numValue > 0) {
      onAmountChange(numValue.toFixed(2));
      return;
    }

    onAmountChange('');
  }, [amount, onAmountChange]);

  const handleTokenAmountChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      if (value === '' || isUnsignedDecimalInput(value)) {
        if (value === '' || value === '.') {
          onAmountChange('');
          onBalancePercentChange(0);
          setPercentInputValue('0');
          return;
        }
        const numToken = parseFloat(value);
        if (
          isNaN(numToken) ||
          numToken <= 0 ||
          currentPrice === 0 ||
          leverage === 0
        ) {
          onAmountChange('');
          onBalancePercentChange(0);
          setPercentInputValue('0');
          return;
        }
        const usdMargin = (numToken * currentPrice) / leverage;
        onAmountChange(usdMargin.toFixed(2));
        if (availableBalance > 0) {
          const pct = Math.min(
            Math.round((usdMargin / availableBalance) * 100),
            100,
          );
          onBalancePercentChange(pct);
          setPercentInputValue(String(pct));
        } else {
          onBalancePercentChange(0);
          setPercentInputValue('0');
        }
      }
    },
    [
      currentPrice,
      leverage,
      availableBalance,
      onAmountChange,
      onBalancePercentChange,
    ],
  );

  const handleTokenBlur = useCallback(() => {
    // Token value is derived from amount; no need to sync back on blur
  }, []);

  const handleSliderChange = useCallback(
    (_event: React.ChangeEvent<unknown>, value: number | number[]) => {
      const percent = Array.isArray(value) ? value[0] : value;
      onBalancePercentChange(percent);
      setPercentInputValue(String(percent));
      if (percent === 0) {
        onAmountChange('');
      } else {
        const newAmount = (availableBalance * percent) / 100;
        onAmountChange(newAmount.toFixed(2));
      }
    },
    [onAmountChange, onBalancePercentChange, availableBalance],
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
            const newAmount = (availableBalance * num) / 100;
            onAmountChange(newAmount.toFixed(2));
          }
        }
      }
    },
    [onAmountChange, onBalancePercentChange, availableBalance],
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
      onAmountChange(availableBalance.toFixed(2));
    } else {
      onBalancePercentChange(num);
      setPercentInputValue(String(num));
    }
  }, [
    percentInputValue,
    onAmountChange,
    onBalancePercentChange,
    availableBalance,
  ]);

  return (
    <Box flexDirection={BoxFlexDirection.Column} gap={3}>
      {/* Header: Size, then Available to trade below (both left-aligned) */}
      <Box flexDirection={BoxFlexDirection.Column} gap={1}>
        <Text variant={TextVariant.BodySm}>{t('perpsSize')}</Text>
        <Box
          flexDirection={BoxFlexDirection.Row}
          justifyContent={BoxJustifyContent.Between}
          gap={2}
        >
          <Text variant={TextVariant.BodyXs} color={TextColor.TextAlternative}>
            {t('perpsAvailableToTrade')}
          </Text>
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
            gap={1}
          >
            <Text
              variant={TextVariant.BodyXs}
              color={TextColor.TextAlternative}
            >
              {`${formatCurrencyWithMinThreshold(availableBalance, 'USD')} USDC`}
            </Text>
            <Icon
              name={IconName.AddCircle}
              size={IconSize.Sm}
              color={IconColor.IconMuted}
              aria-label="Add Funds"
              onClick={onAddFunds}
              className="bg-transparent border-0 p-0 cursor-pointer flex items-center"
              data-testid="amount-input-add-funds"
            />
          </Box>
        </Box>
      </Box>

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
            value={tokenDisplayValue}
            onChange={handleTokenAmountChange}
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
                {asset}
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
