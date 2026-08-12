import {
  Box,
  Text,
  SensitiveText,
  TextVariant,
  TextColor,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  IconColor,
} from '@metamask/design-system-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import {
  BorderRadius,
  BackgroundColor,
} from '../../../../../../helpers/constants/design-system';
import { useFormatters } from '../../../../../../hooks/useFormatters';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { formatPositionSize } from '../../../../../../../shared/lib/perps-formatters';
import { getPreferences } from '../../../../../../../shared/lib/selectors/preferences';
import { TextField, TextFieldSize } from '../../../../../component-library';
import { PerpsSlider } from '../../../perps-slider';
import { getDisplaySymbol } from '../../../utils';
import type { AmountInputProps } from '../../order-entry.types';
import {
  formatNumberForInput,
  isDigitsOnlyInput,
  isUnsignedDecimalInput,
} from '../../utils';
import {
  getSizeDenomination,
  setSizeDenomination,
} from './size-denomination-store';

const handleNumericFocusSelectAll = (
  event: React.FocusEvent<HTMLInputElement>,
) => {
  event.target.select();
};

/**
 * AmountInput - Size section with a single denomination-toggled input and slider
 *
 * Compact layout: "Available to trade XX USDC" row, a single Size input whose
 * denomination toggles between USD (default) and the asset via a swap icon, and
 * a slider with a percentage pill. USD remains the internal source of truth
 * (`amount`); the asset value is derived from it. No preset buttons.
 * @param options0
 * @param options0.amount
 * @param options0.onAmountChange
 * @param options0.balancePercent
 * @param options0.onBalancePercentChange
 * @param options0.availableBalance
 * @param options0.leverage
 * @param options0.asset
 * @param options0.currentPrice
 * @param options0.currentPositionSize
 * @param options0.onAddFunds
 * @param options0.szDecimals
 * @param options0.autoFocus
 * @param options0.usdPlaceholder
 * @param options0.usdInputRef
 * @param options0.onInputMethodChange
 */
export const AmountInput = ({
  amount,
  onAmountChange,
  onInputMethodChange,
  balancePercent,
  onBalancePercentChange,
  availableBalance,
  leverage,
  asset,
  currentPrice,
  szDecimals,
  currentPositionSize,
  onAddFunds,
  autoFocus = false,
  usdPlaceholder = '0.00',
  usdInputRef,
}: AmountInputProps) => {
  const t = useI18nContext();
  const { formatNumber } = useFormatters();
  const { privacyMode } = useSelector(getPreferences);
  const [percentInputValue, setPercentInputValue] = useState<string>(
    String(balancePercent),
  );

  // Active input denomination ('usd' default). Persisted per-market for the
  // current session so navigating away and back keeps the last-used choice.
  const [denomination, setDenomination] = useState(() =>
    getSizeDenomination(asset),
  );
  const isUsdDenomination = denomination === 'usd';

  // Re-read the stored denomination whenever the market changes so each market
  // keeps its own last-used choice.
  useEffect(() => {
    setDenomination(getSizeDenomination(asset));
  }, [asset]);

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

  const currentPositionDisplay = useMemo(() => {
    if (currentPositionSize === undefined) {
      return null;
    }

    const parsedPositionSize = Number.parseFloat(
      currentPositionSize.replace(/,/gu, ''),
    );
    const totalPositionSize = Number.isFinite(parsedPositionSize)
      ? Math.abs(parsedPositionSize)
      : 0;

    return `${formatPositionSize(totalPositionSize, szDecimals)} ${getDisplaySymbol(asset)}`;
  }, [asset, currentPositionSize, szDecimals]);

  // Floor to 2 decimals instead of rounding. At 100% the size is computed as
  // availableBalance * leverage; rounding up (toFixed) could push the amount
  // above that budget, so marginRequired (amount / leverage) exceeded the
  // available balance by a sub-cent and the order form showed a false
  // "Insufficient funds" error. Flooring guarantees the amount never exceeds
  // availableBalance * leverage, mirroring mobile's Math.floor in
  // usePerpsOrderForm (handlePercentageAmount / handleMaxAmount).
  const formatAmount = useCallback(
    (value: number): string => (Math.floor(value * 100) / 100).toFixed(2),
    [],
  );

  const handleAmountChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      if (!(value === '' || isUnsignedDecimalInput(value))) {
        return;
      }

      onInputMethodChange?.('keypad');
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
    [
      onAmountChange,
      onInputMethodChange,
      onBalancePercentChange,
      availableBalance,
      leverage,
    ],
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

      onInputMethodChange?.('keypad');
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
      onInputMethodChange,
      onBalancePercentChange,
      formatAmount,
    ],
  );

  const handleTokenFocus = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      setTokenInputValue(unGroupedTokenDisplay);
      setIsEditingToken(true);
      // The displayed value is unchanged on focus (it already equals
      // unGroupedTokenDisplay), so selecting the current text is safe here.
      event.target.select();
    },
    [unGroupedTokenDisplay],
  );

  const handleTokenBlur = useCallback(() => {
    setIsEditingToken(false);
  }, []);

  const handleToggleDenomination = useCallback(() => {
    // Exit any in-progress token draft so the field re-derives from the USD
    // amount (the source of truth) after switching denominations.
    setIsEditingToken(false);
    setDenomination((prev) => {
      const next = prev === 'usd' ? 'asset' : 'usd';
      setSizeDenomination(asset, next);
      return next;
    });
  }, [asset]);

  const handleSliderChange = useCallback(
    (_event: Event, value: number | number[]) => {
      const percent = Array.isArray(value) ? value[0] : value;
      onInputMethodChange?.(percent >= 100 ? 'max' : 'slider');
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
      onInputMethodChange,
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
          onInputMethodChange?.(num >= 100 ? 'max' : 'percentage');
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
      onInputMethodChange,
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
      {currentPositionDisplay !== null && (
        <Box
          flexDirection={BoxFlexDirection.Row}
          justifyContent={BoxJustifyContent.Between}
          alignItems={BoxAlignItems.Center}
          data-testid="perps-current-position-size-row"
        >
          <Text variant={TextVariant.BodySm}>{t('perpsPosition')}</Text>
          <Text
            variant={TextVariant.BodySm}
            data-testid="perps-current-position-size-value"
          >
            {currentPositionDisplay}
          </Text>
        </Box>
      )}

      {/* Available to trade row */}
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
        alignItems={BoxAlignItems.Center}
        data-testid="amount-input-available-to-trade-row"
      >
        <Text variant={TextVariant.BodySm}>{t('perpsAvailableToTrade')}</Text>
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={2}
        >
          <SensitiveText variant={TextVariant.BodySm} isHidden={privacyMode}>
            {`${formatNumber(availableBalance, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC`}
          </SensitiveText>
          <ButtonIcon
            iconName={IconName.AddCircle}
            size={ButtonIconSize.Xs}
            iconProps={{ color: IconColor.IconAlternative }}
            ariaLabel="Add Funds"
            type="button"
            onClick={onAddFunds}
            data-testid="amount-input-add-funds"
          />
        </Box>
      </Box>

      {/* Single size input with a USD/asset denomination toggle */}
      <TextField
        size={TextFieldSize.Md}
        value={isUsdDenomination ? amount : displayedTokenValue}
        onChange={
          isUsdDenomination ? handleAmountChange : handleTokenAmountChange
        }
        onFocus={
          isUsdDenomination ? handleNumericFocusSelectAll : handleTokenFocus
        }
        onBlur={isUsdDenomination ? handleAmountBlur : handleTokenBlur}
        placeholder={isUsdDenomination ? usdPlaceholder : '0'}
        borderRadius={BorderRadius.MD}
        borderWidth={0}
        backgroundColor={BackgroundColor.backgroundMuted}
        className="w-full"
        data-testid="amount-input-field"
        autoFocus={autoFocus}
        inputRef={usdInputRef}
        inputProps={{
          inputMode: 'decimal',
          style: { textAlign: 'right' },
        }}
        startAccessory={
          <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
            {t('perpsSize')}
          </Text>
        }
        endAccessory={
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
            gap={1}
          >
            <Text
              variant={TextVariant.BodyMd}
              color={TextColor.TextAlternative}
              data-testid="amount-input-denomination-unit"
            >
              {isUsdDenomination ? 'USD' : getDisplaySymbol(asset)}
            </Text>
            <ButtonIcon
              iconName={IconName.SwapHorizontal}
              size={ButtonIconSize.Xs}
              iconProps={{ color: IconColor.IconAlternative }}
              ariaLabel="Toggle size denomination"
              type="button"
              onClick={handleToggleDenomination}
              data-testid="toggle-denomination"
            />
          </Box>
        }
      />

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
        <Box className="shrink-0" style={{ width: '4.5rem' }}>
          <TextField
            size={TextFieldSize.Sm}
            value={percentInputValue}
            onChange={handlePercentInputChange}
            onFocus={handleNumericFocusSelectAll}
            onBlur={handlePercentInputBlur}
            borderRadius={BorderRadius.MD}
            borderWidth={0}
            backgroundColor={BackgroundColor.backgroundMuted}
            className="w-full"
            data-testid="balance-percent-input"
            inputProps={{
              inputMode: 'numeric',
              style: { textAlign: 'right', paddingLeft: '8px' },
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
