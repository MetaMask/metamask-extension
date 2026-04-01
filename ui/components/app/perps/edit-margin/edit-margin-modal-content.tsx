import {
  Box,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
  Button,
  ButtonVariant,
  ButtonSize,
  Icon,
  IconName,
  IconSize,
  IconColor,
} from '@metamask/design-system-react';
import type { Position as PerpsPosition } from '@metamask/perps-controller';
import React, { useState, useCallback, useEffect, useMemo } from 'react';

import {
  BorderRadius,
  BackgroundColor,
} from '../../../../helpers/constants/design-system';
import { usePerpsEligibility } from '../../../../hooks/perps';
import { MARGIN_ADJUSTMENT_CONFIG } from '../../../../hooks/perps/marginUtils';
import { usePerpsMarginCalculations } from '../../../../hooks/perps/usePerpsMarginCalculations';
import { useFormatters } from '../../../../hooks/useFormatters';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { getPerpsStreamManager } from '../../../../providers/perps';
import { submitRequestToBackground } from '../../../../store/background-connection';
import { TextField, TextFieldSize } from '../../../component-library';
import { PerpsSlider } from '../perps-slider';
import type { Position, AccountState } from '../types';
import { floorToDecimals } from '../utils/number';

export type EditMarginModalContentProps = {
  position: Position;
  account: AccountState | null;
  currentPrice: number;
  /** When used in modal: 'add' or 'remove' for single-purpose modal. No in-content toggle. */
  mode: 'add' | 'remove';
  onClose: () => void;
  /** When true, the built-in save button is hidden (modal footer handles save). */
  externalSave?: boolean;
  /** Ref that will be set to the save handler so the parent can invoke it. */
  onSaveRef?: React.MutableRefObject<(() => void) | null>;
  /** Called whenever the save button's enabled state changes. */
  onSaveEnabledChange?: (enabled: boolean) => void;
  /** Called when the saving state changes (true = save in progress, false = done). */
  onSavingChange?: (saving: boolean) => void;
};

/**
 * Shared margin form content: available line, slider + USD amount, new liquidation info, save.
 * Used inside EditMarginModal (and optionally EditMarginExpandable) with a fixed mode.
 * @param options0
 * @param options0.position
 * @param options0.account
 * @param options0.currentPrice
 * @param options0.mode
 * @param options0.onClose
 * @param options0.externalSave
 * @param options0.onSaveRef
 * @param options0.onSaveEnabledChange
 * @param options0.onSavingChange
 */
export const EditMarginModalContent: React.FC<EditMarginModalContentProps> = ({
  position,
  account,
  currentPrice,
  mode: marginMode,
  onClose,
  externalSave = false,
  onSaveRef,
  onSaveEnabledChange,
  onSavingChange,
}) => {
  const t = useI18nContext();
  const { formatNumber, formatCurrencyWithMinThreshold } = useFormatters();
  const { isEligible } = usePerpsEligibility();

  const [marginAmount, setMarginAmount] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [marginError, setMarginError] = useState<string | null>(null);

  const calculations = usePerpsMarginCalculations({
    position,
    currentPrice,
    account,
    mode: marginMode,
    amount: marginAmount,
  });

  const {
    maxAmount,
    anchorLiquidationPrice,
    estimatedLiquidationPrice,
    anchorLiquidationDistance,
    estimatedLiquidationDistance,
    riskAssessment,
  } = calculations;
  const flooredMaxAmount = floorToDecimals(maxAmount);
  const parsedAmount = useMemo(
    () => Number.parseFloat(marginAmount.replaceAll(',', '')) || 0,
    [marginAmount],
  );
  const currentMargin = Number.parseFloat(position.marginUsed) || 0;
  const isAmountValid =
    parsedAmount >= MARGIN_ADJUSTMENT_CONFIG.MinAdjustmentAmount &&
    parsedAmount <= flooredMaxAmount &&
    (marginMode === 'add' || parsedAmount <= currentMargin);

  const showLiquidationComparison = parsedAmount > 0;

  const liquidationPriceDisplay = useMemo(() => {
    if (
      anchorLiquidationPrice === null ||
      !Number.isFinite(anchorLiquidationPrice)
    ) {
      return (
        <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
          -
        </Text>
      );
    }
    if (
      showLiquidationComparison &&
      estimatedLiquidationPrice !== null &&
      Number.isFinite(estimatedLiquidationPrice)
    ) {
      return (
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={1}
          className="max-w-[65%] flex-wrap justify-end"
        >
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            $
            {formatNumber(anchorLiquidationPrice, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            →
          </Text>
          <Text
            variant={TextVariant.BodySm}
            color={TextColor.TextDefault}
            fontWeight={FontWeight.Medium}
          >
            $
            {formatNumber(estimatedLiquidationPrice, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
        </Box>
      );
    }
    return (
      <Text
        variant={TextVariant.BodySm}
        color={TextColor.TextDefault}
        fontWeight={FontWeight.Medium}
      >
        $
        {formatNumber(estimatedLiquidationPrice ?? anchorLiquidationPrice, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </Text>
    );
  }, [
    anchorLiquidationPrice,
    estimatedLiquidationPrice,
    showLiquidationComparison,
    formatNumber,
  ]);

  const formatAmount = useCallback(
    (value: number): string =>
      formatNumber(value, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [formatNumber],
  );

  const marginPercent = useMemo(() => {
    if (maxAmount <= 0) {
      return 0;
    }
    return Math.min(100, Math.round((parsedAmount / maxAmount) * 100));
  }, [parsedAmount, maxAmount]);

  const handleAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target;
      if (value === '' || /^[\d,]*\.?\d{0,2}$/u.test(value)) {
        let cleaned = value.replaceAll(',', '');
        if (marginMode === 'remove' && flooredMaxAmount > 0) {
          const num = Number.parseFloat(cleaned) || 0;
          if (num > flooredMaxAmount) {
            cleaned = flooredMaxAmount.toFixed(2);
          }
        }
        setMarginAmount(cleaned);
      }
    },
    [marginMode, flooredMaxAmount],
  );

  const handleSliderChange = useCallback(
    (_event: React.ChangeEvent<unknown>, value: number | number[]) => {
      if (maxAmount <= 0) {
        return;
      }
      const percent = Array.isArray(value) ? value[0] : value;
      if (percent === 0) {
        setMarginAmount('');
        return;
      }
      const raw = (maxAmount * percent) / 100;
      const floored = floorToDecimals(raw);
      if (floored <= 0) {
        setMarginAmount('');
        return;
      }
      setMarginAmount(formatAmount(floored));
    },
    [maxAmount, formatAmount],
  );

  const handleSaveMargin = useCallback(async () => {
    if (!isEligible || !isAmountValid) {
      return;
    }

    const rawMarginAmount = marginAmount.replaceAll(',', '');
    if (parsedAmount <= 0) {
      return;
    }

    setIsSaving(true);
    onSavingChange?.(true);
    setMarginError(null);

    try {
      const signedAmount =
        marginMode === 'add' ? rawMarginAmount : `-${rawMarginAmount}`;

      const result = await submitRequestToBackground<{
        success: boolean;
        error?: string;
      }>('perpsUpdateMargin', [
        {
          symbol: position.symbol,
          amount: signedAmount,
        },
      ]);

      if (!result.success) {
        throw new Error(result.error || 'Failed to update margin');
      }

      const streamManager = getPerpsStreamManager();
      const freshPositions = await submitRequestToBackground<PerpsPosition[]>(
        'perpsGetPositions',
        [{ skipCache: true }],
      );
      streamManager.pushPositionsWithOverrides(freshPositions);

      setMarginAmount('');
      onClose();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred';
      setMarginError(errorMessage);
    } finally {
      setIsSaving(false);
      onSavingChange?.(false);
    }
  }, [
    isEligible,
    marginMode,
    marginAmount,
    isAmountValid,
    parsedAmount,
    position.symbol,
    onClose,
    onSavingChange,
  ]);

  const showRiskWarning =
    marginMode === 'remove' &&
    riskAssessment &&
    (riskAssessment.riskLevel === 'warning' ||
      riskAssessment.riskLevel === 'danger');

  const confirmDisabled =
    !isEligible || !isAmountValid || isSaving || parsedAmount <= 0;

  useEffect(() => {
    if (onSaveRef) {
      onSaveRef.current = confirmDisabled ? null : handleSaveMargin;
    }
    onSaveEnabledChange?.(!confirmDisabled);
  }, [confirmDisabled, handleSaveMargin, onSaveRef, onSaveEnabledChange]);

  const getConfirmButtonLabel = () => {
    if (isSaving) {
      return t('perpsSubmitting');
    }
    return marginMode === 'add' ? t('perpsAddMargin') : t('perpsRemoveMargin');
  };

  const availableLabel =
    marginMode === 'add'
      ? t('perpsAvailableToAdd')
      : t('perpsAvailableToSubtract');

  return (
    <Box flexDirection={BoxFlexDirection.Column} gap={4}>
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
        alignItems={BoxAlignItems.Center}
      >
        <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
          {availableLabel}
        </Text>
        <Text
          variant={TextVariant.BodySm}
          fontWeight={FontWeight.Medium}
          color={TextColor.TextAlternative}
        >
          {`${formatCurrencyWithMinThreshold(maxAmount, 'USD')} USDC`}
        </Text>
      </Box>

      <Box flexDirection={BoxFlexDirection.Column} gap={2}>
        <Text
          variant={TextVariant.BodySm}
          color={TextColor.TextAlternative}
          fontWeight={FontWeight.Medium}
        >
          {t('perpsMargin')}
        </Text>
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={2}
        >
          <Box
            className="min-w-0 flex-1 px-3"
            data-testid="perps-margin-amount-slider"
          >
            <PerpsSlider
              min={0}
              max={100}
              step={1}
              value={marginPercent}
              onChange={handleSliderChange}
              disabled={maxAmount <= 0 || isSaving}
            />
          </Box>
          <Box className="w-[5.5rem] shrink-0">
            <TextField
              size={TextFieldSize.Md}
              value={marginAmount}
              onChange={handleAmountChange}
              placeholder="0.00"
              borderRadius={BorderRadius.MD}
              borderWidth={0}
              backgroundColor={BackgroundColor.backgroundMuted}
              className="w-full"
              disabled={isSaving}
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
        </Box>
      </Box>

      <Box flexDirection={BoxFlexDirection.Column} gap={2}>
        <Box
          flexDirection={BoxFlexDirection.Row}
          justifyContent={BoxJustifyContent.Between}
          alignItems={BoxAlignItems.Center}
          gap={2}
        >
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            {t('perpsLiquidationPrice')}
          </Text>
          {liquidationPriceDisplay}
        </Box>

        <Box
          flexDirection={BoxFlexDirection.Row}
          justifyContent={BoxJustifyContent.Between}
          alignItems={BoxAlignItems.Center}
          gap={2}
        >
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            {t('perpsLiquidationDistance')}
          </Text>
          {showLiquidationComparison &&
          estimatedLiquidationDistance !== null &&
          Number.isFinite(estimatedLiquidationDistance) ? (
            <Box
              flexDirection={BoxFlexDirection.Row}
              alignItems={BoxAlignItems.Center}
              gap={1}
              className="max-w-[65%] flex-wrap justify-end"
            >
              <Text
                variant={TextVariant.BodySm}
                color={TextColor.TextAlternative}
              >
                {formatNumber(anchorLiquidationDistance, {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })}
                %
              </Text>
              <Text
                variant={TextVariant.BodySm}
                color={TextColor.TextAlternative}
              >
                →
              </Text>
              <Text
                variant={TextVariant.BodySm}
                color={TextColor.TextDefault}
                fontWeight={FontWeight.Medium}
              >
                {formatNumber(estimatedLiquidationDistance, {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })}
                %
              </Text>
            </Box>
          ) : (
            <Text
              variant={TextVariant.BodySm}
              color={TextColor.TextDefault}
              fontWeight={FontWeight.Medium}
            >
              {formatNumber(anchorLiquidationDistance, {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })}
              %
            </Text>
          )}
        </Box>
      </Box>

      {/* Risk warning (remove mode) */}
      {showRiskWarning && (
        <Box
          className="bg-warning-muted rounded-lg px-3 py-2"
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={2}
        >
          <Icon
            name={IconName.Warning}
            size={IconSize.Sm}
            color={IconColor.WarningDefault}
          />
          <Text variant={TextVariant.BodySm} color={TextColor.WarningDefault}>
            {t('perpsMarginRiskWarning')}
          </Text>
        </Box>
      )}

      {/* Error message */}
      {marginError && (
        <Box
          className="bg-error-muted rounded-lg px-3 py-2"
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={2}
        >
          <Icon
            name={IconName.Warning}
            size={IconSize.Sm}
            color={IconColor.ErrorDefault}
          />
          <Text variant={TextVariant.BodySm} color={TextColor.ErrorDefault}>
            {marginError}
          </Text>
        </Box>
      )}

      {!externalSave && (
        <Button
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          isFullWidth
          onClick={handleSaveMargin}
          disabled={confirmDisabled}
          data-testid="perps-edit-margin-confirm"
        >
          {getConfirmButtonLabel()}
        </Button>
      )}
    </Box>
  );
};
