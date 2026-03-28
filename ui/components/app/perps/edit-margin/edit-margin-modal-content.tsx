import React, { useState, useCallback, useEffect } from 'react';
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
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { TextField, TextFieldSize } from '../../../component-library';
import {
  BorderRadius,
  BackgroundColor,
} from '../../../../helpers/constants/design-system';
import { submitRequestToBackground } from '../../../../store/background-connection';
import { getPerpsStreamManager } from '../../../../providers/perps';
import { useFormatters } from '../../../../hooks/useFormatters';
import { usePerpsEligibility } from '../../../../hooks/perps';
import { usePerpsMarginCalculations } from '../../../../hooks/perps/usePerpsMarginCalculations';
import type { Position, AccountState } from '../types';

const MARGIN_PRESETS = [25, 50, 100] as const;

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
 * Shared margin form content: amount input, presets, liquidation info, risk warning, save.
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
  const { formatNumber } = useFormatters();
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
    newLiquidationPrice,
    currentLiquidationDistance,
    newLiquidationDistance,
    riskAssessment,
    isValid,
  } = calculations;

  const handleAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target;
      if (value === '' || /^[\d,]*\.?\d{0,2}$/u.test(value)) {
        let cleaned = value.replace(/,/gu, '');
        if (marginMode === 'remove' && maxAmount > 0) {
          const num = parseFloat(cleaned) || 0;
          if (num > maxAmount) {
            cleaned = maxAmount.toFixed(2);
          }
        }
        setMarginAmount(cleaned);
      }
    },
    [marginMode, maxAmount],
  );

  const handlePresetClick = useCallback(
    (percent: number) => {
      if (maxAmount <= 0) {
        return;
      }
      const value = (maxAmount * percent) / 100;
      setMarginAmount(value.toFixed(2));
    },
    [maxAmount],
  );

  const handleSaveMargin = useCallback(async () => {
    if (!isEligible || !isValid) {
      return;
    }

    const amountNum = parseFloat(marginAmount) || 0;
    if (amountNum <= 0) {
      return;
    }

    setIsSaving(true);
    onSavingChange?.(true);
    setMarginError(null);

    try {
      const signedAmount =
        marginMode === 'add' ? marginAmount : `-${marginAmount}`;

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
    isValid,
    position.symbol,
    onClose,
    onSavingChange,
  ]);

  const currentLiqPrice = position.liquidationPrice
    ? parseFloat(position.liquidationPrice)
    : null;

  const showRiskWarning =
    marginMode === 'remove' &&
    riskAssessment &&
    (riskAssessment.riskLevel === 'warning' ||
      riskAssessment.riskLevel === 'danger');

  const confirmDisabled =
    !isEligible || !isValid || isSaving || parseFloat(marginAmount) <= 0;

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
    marginMode === 'add' ? t('perpsAvailableBalance') : t('perpsMaxRemovable');

  return (
    <Box flexDirection={BoxFlexDirection.Column} gap={4}>
      {/* Amount input */}
      <Box flexDirection={BoxFlexDirection.Column} gap={2}>
        <Text
          variant={TextVariant.BodySm}
          color={TextColor.TextAlternative}
          fontWeight={FontWeight.Medium}
        >
          {t('perpsMargin')}
        </Text>
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

      {/* Preset buttons: 25%, 50%, Max */}
      <Box flexDirection={BoxFlexDirection.Row} gap={2}>
        {MARGIN_PRESETS.map((preset) => (
          <Box
            key={`margin-preset-${preset}`}
            onClick={isSaving ? undefined : () => handlePresetClick(preset)}
            className={`flex-1 py-1.5 rounded-lg bg-background-default cursor-pointer text-center hover:bg-muted-hover active:bg-muted-pressed border border-muted transition-colors duration-150${
              isSaving
                ? ' opacity-50 cursor-not-allowed pointer-events-none'
                : ''
            }`}
          >
            <Text
              variant={TextVariant.BodySm}
              color={TextColor.TextAlternative}
            >
              {preset === 100 ? t('perpsMax') : `${preset}%`}
            </Text>
          </Box>
        ))}
      </Box>

      {/* Info rows */}
      <Box flexDirection={BoxFlexDirection.Column} gap={2}>
        <Box
          flexDirection={BoxFlexDirection.Row}
          justifyContent={BoxJustifyContent.Between}
          alignItems={BoxAlignItems.Center}
        >
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            {availableLabel}
          </Text>
          <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
            $
            {formatNumber(maxAmount, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
        </Box>

        <Box
          flexDirection={BoxFlexDirection.Row}
          justifyContent={BoxJustifyContent.Between}
          alignItems={BoxAlignItems.Center}
        >
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            {t('perpsLiquidationPrice')}
          </Text>
          <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
            {currentLiqPrice === null
              ? '-'
              : `$${formatNumber(currentLiqPrice, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`}
            {newLiquidationPrice !== null &&
              ` → $${formatNumber(newLiquidationPrice, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}
          </Text>
        </Box>

        <Box
          flexDirection={BoxFlexDirection.Row}
          justifyContent={BoxJustifyContent.Between}
          alignItems={BoxAlignItems.Center}
        >
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            {t('perpsLiquidationDistance')}
          </Text>
          <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
            {formatNumber(currentLiquidationDistance, {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })}
            %
            {newLiquidationDistance !== null &&
              ` → ${formatNumber(newLiquidationDistance, {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })}%`}
          </Text>
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
