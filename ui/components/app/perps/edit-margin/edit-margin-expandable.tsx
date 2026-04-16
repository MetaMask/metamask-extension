import React, { useState, useCallback } from 'react';
import {
  twMerge,
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
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { TextField, TextFieldSize } from '../../../component-library';
import {
  BorderRadius,
  BackgroundColor,
} from '../../../../helpers/constants/design-system';
import { getPerpsController } from '../../../../providers/perps';
import { getPerpsStreamManager } from '../../../../providers/perps/PerpsStreamManager';
import { useFormatters } from '../../../../hooks/useFormatters';
import { usePerpsEligibility } from '../../../../hooks/perps';
import { usePerpsMarginCalculations } from '../../../../hooks/perps/usePerpsMarginCalculations';
import type { Position, AccountState } from '../types';

const MARGIN_PRESETS = [25, 50, 100] as const; // 25%, 50%, Max (100%)

export type EditMarginExpandableProps = {
  position: Position;
  account: AccountState | null;
  currentPrice: number;
  selectedAddress: string;
  isExpanded: boolean;
  onToggle: () => void;
};

/**
 * Expandable section for adding or removing margin from an isolated position.
 * Renders the expandable content only; the margin card header lives in the parent.
 *
 * @param options0 - Component props
 * @param options0.position - The position to adjust margin for
 * @param options0.account - The user's account state
 * @param options0.currentPrice - The current market price
 * @param options0.selectedAddress - The selected wallet address
 * @param options0.isExpanded - Whether the expandable section is open
 * @param options0.onToggle - Callback when the section is toggled
 */
export const EditMarginExpandable: React.FC<EditMarginExpandableProps> = ({
  position,
  account,
  currentPrice,
  selectedAddress,
  isExpanded,
  onToggle,
}) => {
  const t = useI18nContext();
  const { formatNumber } = useFormatters();
  const { isEligible } = usePerpsEligibility();

  const [marginMode, setMarginMode] = useState<'add' | 'remove'>('add');
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
    if (!isEligible || !selectedAddress || !isValid) {
      return;
    }

    const amountNum = parseFloat(marginAmount) || 0;
    if (amountNum <= 0) {
      return;
    }

    setIsSaving(true);
    setMarginError(null);

    try {
      const controller = await getPerpsController(selectedAddress);
      const signedAmount =
        marginMode === 'add' ? marginAmount : `-${marginAmount}`;

      const result = await controller.updateMargin({
        symbol: position.symbol,
        amount: signedAmount,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to update margin');
      }

      const streamManager = getPerpsStreamManager();
      const freshPositions = await controller.getPositions({
        skipCache: true,
      });
      streamManager.pushPositionsWithOverrides(freshPositions);

      setMarginAmount('');
      onToggle();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred';
      setMarginError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  }, [
    isEligible,
    selectedAddress,
    marginMode,
    marginAmount,
    isValid,
    position.symbol,
    onToggle,
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

  const getConfirmButtonLabel = () => {
    if (isSaving) {
      return t('perpsSubmitting');
    }
    return marginMode === 'add' ? t('perpsAddMargin') : t('perpsRemoveMargin');
  };

  return (
    <Box
      className="rounded-xl bg-muted overflow-hidden"
      flexDirection={BoxFlexDirection.Column}
    >
      <Box
        className={twMerge(
          'grid transition-all duration-300 ease-in-out',
          isExpanded
            ? 'grid-rows-[1fr] opacity-100'
            : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <Box
          className="overflow-hidden"
          flexDirection={BoxFlexDirection.Column}
        >
          <Box
            className="px-4 py-3"
            flexDirection={BoxFlexDirection.Column}
            gap={4}
          >
            {/* Mode toggle: Add / Remove */}
            <Box
              flexDirection={BoxFlexDirection.Row}
              className="w-full bg-background-default rounded-xl p-1 gap-1"
            >
              <Box
                onClick={
                  isSaving
                    ? undefined
                    : () => {
                        setMarginMode('add');
                        setMarginError(null);
                      }
                }
                className={twMerge(
                  'flex-1 py-2 rounded-lg text-center cursor-pointer transition-colors',
                  marginMode === 'add'
                    ? 'bg-primary-default'
                    : 'hover:bg-muted-hover active:bg-muted-pressed',
                  isSaving &&
                    'opacity-50 cursor-not-allowed pointer-events-none',
                )}
              >
                <Text
                  variant={TextVariant.BodyMd}
                  fontWeight={FontWeight.Medium}
                  color={
                    marginMode === 'add'
                      ? TextColor.PrimaryInverse
                      : TextColor.TextDefault
                  }
                >
                  {t('perpsAddMargin')}
                </Text>
              </Box>
              <Box
                onClick={
                  isSaving
                    ? undefined
                    : () => {
                        setMarginMode('remove');
                        setMarginError(null);
                      }
                }
                className={twMerge(
                  'flex-1 py-2 rounded-lg text-center cursor-pointer transition-colors',
                  marginMode === 'remove'
                    ? 'bg-primary-default'
                    : 'hover:bg-muted-hover active:bg-muted-pressed',
                  isSaving &&
                    'opacity-50 cursor-not-allowed pointer-events-none',
                )}
              >
                <Text
                  variant={TextVariant.BodyMd}
                  fontWeight={FontWeight.Medium}
                  color={
                    marginMode === 'remove'
                      ? TextColor.PrimaryInverse
                      : TextColor.TextDefault
                  }
                >
                  {t('perpsRemoveMargin')}
                </Text>
              </Box>
            </Box>

            {/* Amount input */}
            <Box flexDirection={BoxFlexDirection.Column} gap={2}>
              <Text
                variant={TextVariant.BodySm}
                color={TextColor.TextAlternative}
                fontWeight={FontWeight.Medium}
              >
                {t('perpsOrderAmount')}
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
                  onClick={
                    isSaving ? undefined : () => handlePresetClick(preset)
                  }
                  className={twMerge(
                    'flex-1 py-1.5 rounded-lg bg-background-default cursor-pointer text-center',
                    'hover:bg-muted-hover active:bg-muted-pressed',
                    'border border-muted transition-colors duration-150',
                    isSaving &&
                      'opacity-50 cursor-not-allowed pointer-events-none',
                  )}
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
                <Text
                  variant={TextVariant.BodySm}
                  color={TextColor.TextAlternative}
                >
                  {marginMode === 'add'
                    ? t('perpsAvailableBalance')
                    : t('perpsMaxRemovable')}
                </Text>
                <Text
                  variant={TextVariant.BodySm}
                  fontWeight={FontWeight.Medium}
                >
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
                <Text
                  variant={TextVariant.BodySm}
                  color={TextColor.TextAlternative}
                >
                  {t('perpsLiquidationPrice')}
                </Text>
                <Text
                  variant={TextVariant.BodySm}
                  fontWeight={FontWeight.Medium}
                >
                  {currentLiqPrice === null
                    ? '-'
                    : `$${formatNumber(currentLiqPrice, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  {newLiquidationPrice !== null &&
                    ` → $${formatNumber(newLiquidationPrice, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </Text>
              </Box>

              <Box
                flexDirection={BoxFlexDirection.Row}
                justifyContent={BoxJustifyContent.Between}
                alignItems={BoxAlignItems.Center}
              >
                <Text
                  variant={TextVariant.BodySm}
                  color={TextColor.TextAlternative}
                >
                  {t('perpsLiquidationDistance')}
                </Text>
                <Text
                  variant={TextVariant.BodySm}
                  fontWeight={FontWeight.Medium}
                >
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
                <Text
                  variant={TextVariant.BodySm}
                  color={TextColor.WarningDefault}
                >
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
                <Text
                  variant={TextVariant.BodySm}
                  color={TextColor.ErrorDefault}
                >
                  {marginError}
                </Text>
              </Box>
            )}

            {/* Confirm button */}
            <Button
              variant={ButtonVariant.Primary}
              size={ButtonSize.Md}
              onClick={handleSaveMargin}
              disabled={confirmDisabled}
              title={isEligible ? undefined : t('perpsGeoBlockedTooltip')}
              className={twMerge(
                'w-full',
                confirmDisabled && 'opacity-70 cursor-not-allowed',
              )}
            >
              {getConfirmButtonLabel()}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
