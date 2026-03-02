import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Text,
  TextVariant,
  TextColor,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
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
import { calculatePositionSize } from '../../order-entry.mocks';

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
  const { formatCurrencyWithMinThreshold, formatNumber } = useFormatters();
  const [percentInputValue, setPercentInputValue] = useState<string>(
    String(balancePercent),
  );

  useEffect(() => {
    setPercentInputValue(String(balancePercent));
  }, [balancePercent]);

  const tokenAmount = useMemo(() => {
    const cleanAmount = amount.replace(/,/gu, '');
    const numAmount = parseFloat(cleanAmount) || 0;
    if (numAmount === 0 || currentPrice === 0) {
      return null;
    }
    const positionValue = numAmount * leverage;
    return calculatePositionSize(positionValue, currentPrice);
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
      if (value === '' || /^[\d,]*\.?\d*$/u.test(value)) {
        onAmountChange(value);
        const cleanValue = value.replace(/,/gu, '');
        if (cleanValue && availableBalance > 0) {
          const numValue = parseFloat(cleanValue);
          if (!isNaN(numValue) && numValue > 0) {
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
      }
    },
    [onAmountChange, onBalancePercentChange, availableBalance],
  );

  const formatAmount = useCallback(
    (value: number): string =>
      formatNumber(value, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [formatNumber],
  );

  const handleAmountBlur = useCallback(() => {
    if (amount) {
      const numValue = parseFloat(amount.replace(/,/gu, ''));
      if (!isNaN(numValue) && numValue > 0) {
        onAmountChange(formatAmount(numValue));
      }
    }
  }, [amount, onAmountChange, formatAmount]);

  const handleTokenAmountChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      if (value === '' || /^\d+(\.\d*)?$|^\.\d*$/u.test(value)) {
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
        onAmountChange(formatAmount(usdMargin));
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
      formatAmount,
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
        onAmountChange(formatAmount(newAmount));
      }
    },
    [onAmountChange, onBalancePercentChange, availableBalance, formatAmount],
  );

  const handlePercentInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      if (value === '' || /^\d*$/u.test(value)) {
        setPercentInputValue(value);
        const num = parseInt(value, 10);
        if (!isNaN(num) && num >= 0 && num <= 100) {
          onBalancePercentChange(num);
          if (num === 0) {
            onAmountChange('');
          } else {
            const newAmount = (availableBalance * num) / 100;
            onAmountChange(formatAmount(newAmount));
          }
        }
      }
    },
    [onAmountChange, onBalancePercentChange, availableBalance, formatAmount],
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
      onAmountChange(formatAmount(availableBalance));
    } else {
      onBalancePercentChange(num);
      setPercentInputValue(String(num));
    }
  }, [
    percentInputValue,
    onAmountChange,
    onBalancePercentChange,
    availableBalance,
    formatAmount,
  ]);

  const formattedPlaceholder = useMemo(() => formatAmount(0), [formatAmount]);

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
          <Text variant={TextVariant.BodyXs} color={TextColor.TextAlternative}>
            {`${formatCurrencyWithMinThreshold(availableBalance, 'USD')} USDC`}
          </Text>
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
            placeholder={formattedPlaceholder}
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
