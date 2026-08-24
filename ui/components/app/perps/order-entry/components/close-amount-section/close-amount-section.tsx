import React, { useCallback, useMemo, useState } from 'react';
import {
  Box,
  BoxBackgroundColor,
  Text,
  TextVariant,
  TextColor,
  TextAlign,
  FontWeight,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
  Button,
  ButtonSize,
  ButtonVariant,
} from '@metamask/design-system-react';
import { formatPositionSize } from '../../../../../../../shared/lib/perps-formatters';
import {
  BorderRadius,
  BackgroundColor,
} from '../../../../../../helpers/constants/design-system';
import { TextField, TextFieldSize } from '../../../../../component-library';
import { PerpsSlider } from '../../../perps-slider';
import { getDisplaySymbol } from '../../../utils';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import type { CloseAmountSectionProps } from '../../order-entry.types';
import {
  isUnsignedDecimalInput,
  isDigitsOnlyInput,
  formatNumberForInput,
} from '../../utils';

/** Fixed width (rem) for the close-% chip so the slider row layout stays stable as digits change */
const CLOSE_PERCENT_CHIP_WIDTH_REM = 4.75;

/** Largest share of a position a single close can take. */
const MAX_CLOSE_PERCENT = 100;

/** Fractional digits used for the USD close amount, matching mobile. */
const USD_INPUT_DECIMALS = 2;

/** Fractional digits kept when a dollar amount resolves to a partial percent. */
const PERCENT_INPUT_DECIMALS = 2;

/**
 * Which unit the trader types the close amount in. The slider is always
 * available alongside whichever unit is selected, so these two values plus the
 * slider make up the three input modes.
 */
type CloseAmountUnit = 'usd' | 'percent';

/**
 * Clamps a close percentage into the closable range.
 *
 * @param percent - Raw percentage, possibly out of range or non-finite.
 * @returns The percentage constrained to 0-100, or 0 when not a number.
 */
const clampClosePercent = (percent: number): number => {
  if (!Number.isFinite(percent)) {
    return 0;
  }
  return Math.min(MAX_CLOSE_PERCENT, Math.max(0, percent));
};

/**
 * Renders a close percentage for the percent field.
 *
 * A percentage derived from a typed dollar amount is rarely whole, and on a
 * small position one percentage point is worth several cents, so the fraction
 * is kept rather than rounded away. Whole percentages — every value the slider
 * and the percent field itself produce — still render without a decimal tail.
 *
 * @param percent - The committed close percentage.
 * @returns The percentage as editable field text.
 */
const formatPercentForInput = (percent: number): string =>
  formatNumberForInput(percent, PERCENT_INPUT_DECIMALS);

/**
 * CloseAmountSection - Section for selecting how much of a position to close
 *
 * The trader picks the amount in one of three ways: the slider, a USD notional
 * amount, or a percentage of the position. USD and percent share a single field
 * whose unit is chosen by the `$` / `%` selector; the slider is always visible.
 * `closePercent` stays the single source of truth for every mode, so an amount
 * entered in one unit is immediately reflected in the others.
 *
 * @param props - Component props
 * @param props.positionSize - Total position size (absolute value); labeled "Available to close"
 * @param props.closePercent - Percentage of position to close (0-100)
 * @param props.onClosePercentChange - Callback when percentage changes
 * @param props.asset - Asset symbol for display
 * @param props.currentPrice - Current asset price for USD calculation
 * @param props.sizeDecimals - Market size decimals for controller-based size formatting
 * @param props.onInputMethodChange - Reports which control the trader used, for analytics
 */
export const CloseAmountSection = ({
  positionSize,
  closePercent,
  onClosePercentChange,
  asset,
  currentPrice,
  sizeDecimals,
  onInputMethodChange,
}: CloseAmountSectionProps) => {
  const t = useI18nContext();

  const totalPositionSize = Math.abs(Number.parseFloat(positionSize)) || 0;
  const totalNotionalUsd = totalPositionSize * currentPrice;

  const closeValueUsd = useMemo(
    () => (totalNotionalUsd * closePercent) / 100,
    [totalNotionalUsd, closePercent],
  );

  const [unit, setUnit] = useState<CloseAmountUnit>('usd');
  const [rawInput, setRawInput] = useState('');
  const [isUsdInputFocused, setIsUsdInputFocused] = useState(false);
  const [percentInputValue, setPercentInputValue] = useState(() =>
    formatPercentForInput(closePercent),
  );
  // Set when the trader asks for more than the position holds. Cleared as soon
  // as they enter an amount that fits, so it only ever describes the value
  // currently in the field.
  const [didExceedPosition, setDidExceedPosition] = useState(false);

  const isPercentUnit = unit === 'percent';

  const displayValue = useMemo(
    () => formatNumberForInput(closeValueUsd, USD_INPUT_DECIMALS),
    [closeValueUsd],
  );

  // Keep the percent field in step with slider drags and USD entry without an
  // effect, so the displayed value never lags a render behind `closePercent`.
  // Skipped while the trader is typing, so clearing the field to retype does
  // not immediately snap it back to "0".
  const [isEditingPercent, setIsEditingPercent] = useState(false);
  const [prevClosePercent, setPrevClosePercent] = useState(closePercent);
  if (closePercent !== prevClosePercent) {
    setPrevClosePercent(closePercent);
    if (!isEditingPercent) {
      setPercentInputValue(formatPercentForInput(closePercent));
    }
  }

  const commitPercent = useCallback(
    (percent: number) => {
      onClosePercentChange(percent);
      onInputMethodChange?.(
        percent >= MAX_CLOSE_PERCENT ? 'max' : 'percentage',
      );
    },
    [onClosePercentChange, onInputMethodChange],
  );

  const handleUsdInputChange = useCallback(
    ({ target: { value } }: React.ChangeEvent<HTMLInputElement>) => {
      if (!(value === '' || isUnsignedDecimalInput(value))) {
        return;
      }
      onInputMethodChange?.('keypad');

      const parsed = Number.parseFloat(value);
      // `''`, `'.'` and a zero-valued position all mean "no amount chosen".
      // Committing 0 here keeps the field and `closePercent` in agreement; a
      // partially typed value must never leave a stale percentage behind it.
      if (Number.isNaN(parsed) || totalNotionalUsd <= 0) {
        setRawInput(value);
        setDidExceedPosition(false);
        onClosePercentChange(0);
        return;
      }

      // Cap rather than reject: an over-close can never reach submission, and
      // the message below tells the trader why the value changed.
      const exceedsPosition = parsed > totalNotionalUsd;
      setDidExceedPosition(exceedsPosition);
      // Show the capped amount straight away rather than the typed one, so the
      // field agrees with the slider, the summary, and the cap message.
      setRawInput(
        exceedsPosition
          ? formatNumberForInput(totalNotionalUsd, USD_INPUT_DECIMALS)
          : value,
      );
      // Deliberately NOT rounded to a whole percent: the trader asked to close
      // an exact dollar amount, and on a small position one percentage point is
      // several cents. The percent field renders this faithfully.
      onClosePercentChange(
        clampClosePercent((parsed / totalNotionalUsd) * 100),
      );
    },
    [totalNotionalUsd, onClosePercentChange, onInputMethodChange],
  );

  const handleUsdInputFocus = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      setIsUsdInputFocused(true);
      setRawInput(formatNumberForInput(closeValueUsd, USD_INPUT_DECIMALS));
      // The field is pre-filled with the whole position value, so select it the
      // way AmountInput does: typing replaces it instead of appending digits to
      // it and asking for an accidental over-close.
      event.target.select();
    },
    [closeValueUsd],
  );

  const handleUsdInputBlur = useCallback(() => {
    setIsUsdInputFocused(false);
    // The capped percentage is the source of truth; re-deriving the field from
    // it replaces an over-typed amount with the amount actually being closed.
    setRawInput('');
  }, []);

  const handlePercentInputChange = useCallback(
    ({ target: { value } }: React.ChangeEvent<HTMLInputElement>) => {
      if (!(value === '' || isDigitsOnlyInput(value))) {
        return;
      }
      setPercentInputValue(value);

      if (value === '') {
        setDidExceedPosition(false);
        commitPercent(0);
        return;
      }

      const parsed = Number.parseInt(value, 10);
      setDidExceedPosition(parsed > MAX_CLOSE_PERCENT);
      commitPercent(clampClosePercent(parsed));
    },
    [commitPercent],
  );

  const handlePercentInputFocus = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      setIsEditingPercent(true);
      event.target.select();
    },
    [],
  );

  const handlePercentInputBlur = useCallback(() => {
    setIsEditingPercent(false);
    // Snap the field back to the percentage actually committed, so a typed
    // "150" is left showing the "100" that will be closed.
    setPercentInputValue(formatPercentForInput(closePercent));
  }, [closePercent]);

  const handleSliderChange = useCallback(
    (_event: Event, value: number | number[]) => {
      const percent = Array.isArray(value) ? value[0] : value;
      setDidExceedPosition(false);
      onClosePercentChange(percent);
      onInputMethodChange?.(percent >= MAX_CLOSE_PERCENT ? 'max' : 'slider');
    },
    [onClosePercentChange, onInputMethodChange],
  );

  const handleSelectUsdUnit = useCallback(() => {
    setUnit('usd');
    setDidExceedPosition(false);
  }, []);

  const handleSelectPercentUnit = useCallback(() => {
    setUnit('percent');
    setDidExceedPosition(false);
  }, []);

  // While the USD field has focus the trader's own draft is shown, including an
  // empty one; otherwise the field re-derives from the committed percentage.
  const usdFieldValue = isUsdInputFocused ? rawInput : displayValue;
  const fieldValue = isPercentUnit ? percentInputValue : usdFieldValue;

  const overCloseMessage = isPercentUnit
    ? t('perpsClosePercentCappedAtMax')
    : t('perpsCloseAmountCappedAtPosition');

  return (
    <Box flexDirection={BoxFlexDirection.Column} gap={3}>
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
        alignItems={BoxAlignItems.Center}
      >
        <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
          {t('perpsAvailableToClose')}
        </Text>
        <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
          {`${formatPositionSize(totalPositionSize, sizeDecimals)} ${getDisplaySymbol(asset)}`}
        </Text>
      </Box>

      <Box flexDirection={BoxFlexDirection.Column} gap={2}>
        <Box
          flexDirection={BoxFlexDirection.Row}
          justifyContent={BoxJustifyContent.Between}
          alignItems={BoxAlignItems.Center}
        >
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            {t('perpsCloseAmount')}
          </Text>
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
            gap={1}
            role="radiogroup"
            aria-label={t('perpsCloseAmount')}
            data-testid="close-amount-mode-selector"
          >
            <Button
              size={ButtonSize.Sm}
              variant={
                isPercentUnit ? ButtonVariant.Tertiary : ButtonVariant.Secondary
              }
              type="button"
              onClick={handleSelectUsdUnit}
              role="radio"
              aria-checked={!isPercentUnit}
              data-testid="close-amount-mode-usd"
            >
              {t('perpsCloseAmountInUsd')}
            </Button>
            <Button
              size={ButtonSize.Sm}
              variant={
                isPercentUnit ? ButtonVariant.Secondary : ButtonVariant.Tertiary
              }
              type="button"
              onClick={handleSelectPercentUnit}
              role="radio"
              aria-checked={isPercentUnit}
              data-testid="close-amount-mode-percent"
            >
              {t('perpsCloseAmountInPercent')}
            </Button>
          </Box>
        </Box>
        <TextField
          size={TextFieldSize.Md}
          value={fieldValue}
          onChange={
            isPercentUnit ? handlePercentInputChange : handleUsdInputChange
          }
          onFocus={
            isPercentUnit ? handlePercentInputFocus : handleUsdInputFocus
          }
          onBlur={isPercentUnit ? handlePercentInputBlur : handleUsdInputBlur}
          placeholder={isPercentUnit ? '0' : '0.00'}
          borderRadius={BorderRadius.MD}
          borderWidth={0}
          backgroundColor={BackgroundColor.backgroundMuted}
          className="w-full"
          data-testid={
            isPercentUnit ? 'close-amount-percent' : 'close-amount-value'
          }
          inputProps={{
            inputMode: isPercentUnit ? 'numeric' : 'decimal',
          }}
          startAccessory={
            <Text
              variant={TextVariant.BodyMd}
              color={TextColor.TextAlternative}
              data-testid="close-amount-unit"
            >
              {isPercentUnit ? '%' : '$'}
            </Text>
          }
        />
        {didExceedPosition ? (
          <Text
            variant={TextVariant.BodyXs}
            color={TextColor.ErrorDefault}
            data-testid="close-amount-over-close-error"
          >
            {overCloseMessage}
          </Text>
        ) : null}
      </Box>

      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        gap={4}
      >
        <Box
          className="min-w-0 flex-1"
          paddingHorizontal={1}
          data-testid={`close-amount-slider-pct-${closePercent}`}
        >
          <PerpsSlider
            min={0}
            max={MAX_CLOSE_PERCENT}
            step={1}
            value={closePercent}
            onChange={handleSliderChange}
          />
        </Box>
        <Box
          backgroundColor={BoxBackgroundColor.BackgroundMuted}
          className="rounded-lg"
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          justifyContent={BoxJustifyContent.Center}
          paddingHorizontal={2}
          paddingVertical={1}
          style={{
            width: `${CLOSE_PERCENT_CHIP_WIDTH_REM}rem`,
            flexShrink: 0,
          }}
        >
          <Text
            variant={TextVariant.BodySm}
            fontWeight={FontWeight.Medium}
            textAlign={TextAlign.Center}
            style={{ width: '100%', fontVariantNumeric: 'tabular-nums' }}
          >
            {Math.round(closePercent)} %
          </Text>
        </Box>
      </Box>
    </Box>
  );
};

export default CloseAmountSection;
