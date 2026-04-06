import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useLayoutEffect,
  useRef,
} from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
} from '@metamask/design-system-react';
import type { Position as PerpsPosition } from '@metamask/perps-controller';
import { FEE_RATES } from '@metamask/perps-controller';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { TextField, TextFieldSize } from '../../../component-library';
import {
  BorderRadius,
  BackgroundColor,
} from '../../../../helpers/constants/design-system';
import { useFormatters } from '../../../../hooks/useFormatters';
import { usePerpsEligibility } from '../../../../hooks/perps';
import { submitRequestToBackground } from '../../../../store/background-connection';
import { getPerpsStreamManager } from '../../../../providers/perps';
import { usePerpsToast } from '../perps-toast';
import { PERPS_TOAST_KEYS } from '../perps-toast/perps-toast-provider';
import type { Position, PerpsBackgroundResult } from '../types';
import { normalizeTpslPrices } from '../utils';

// RoE (Return on Equity) preset percentages - matching mobile
const TP_PRESETS = [10, 25, 50, 100];
const SL_PRESETS = [5, 10, 25, 50];

/**
 * Format a RoE% value for blurred display.
 * Integers show no decimal ("25"), non-integers show 2 decimal places ("25.50").
 * @param value - The numeric percentage value to format
 */
function formatEditPercent(value: number): string {
  const abs = Math.abs(value);
  return abs % 1 === 0 ? abs.toFixed(0) : abs.toFixed(2);
}

function getPnlDisplayColor(pnl: number): TextColor {
  if (pnl > 0) {
    return TextColor.SuccessDefault;
  }
  if (pnl < 0) {
    return TextColor.ErrorDefault;
  }
  return TextColor.TextDefault;
}

export type UpdateTPSLSubmitState = {
  onSubmit: () => void;
  isSaving: boolean;
  submitDisabled: boolean;
  submitButtonTitle?: string;
};

export type UpdateTPSLModalContentProps = {
  position: Position;
  currentPrice: number;
  onClose: () => void;
  /** Wired by UpdateTPSLModal to place the primary action in ModalFooter */
  onSubmitStateChange?: (state: UpdateTPSLSubmitState) => void;
};

/**
 * TP/SL form content: presets, price/percent inputs, and validation errors.
 * Used inside UpdateTPSLModal. Initializes from position on mount; parent should set
 * `key={position.symbol}` on the modal so edits are not overwritten when the same
 * market is refetched while the modal is open.
 * @param options0
 * @param options0.position
 * @param options0.currentPrice
 * @param options0.onClose
 * @param options0.onSubmitStateChange
 */
export const UpdateTPSLModalContent: React.FC<UpdateTPSLModalContentProps> = ({
  position,
  currentPrice,
  onClose,
  onSubmitStateChange,
}) => {
  const t = useI18nContext();
  const { formatNumber, formatCurrencyWithMinThreshold } = useFormatters();
  const { isEligible } = usePerpsEligibility();
  const { replacePerpsToastByKey } = usePerpsToast();

  const [editingTpPrice, setEditingTpPrice] = useState(
    () => position.takeProfitPrice ?? '',
  );
  const [editingSlPrice, setEditingSlPrice] = useState(
    () => position.stopLossPrice ?? '',
  );
  const [isSaving, setIsSaving] = useState(false);
  const isMountedRef = useRef(true);

  // Raw percent strings for each field, preserved while the user is typing
  const [rawTpPercent, setRawTpPercent] = useState('');
  const [rawSlPercent, setRawSlPercent] = useState('');
  const [isTpPercentFocused, setIsTpPercentFocused] = useState(false);
  const [isSlPercentFocused, setIsSlPercentFocused] = useState(false);

  const entryPriceForEdit = useMemo(() => {
    if (position?.entryPrice) {
      return Number.parseFloat(position.entryPrice.replaceAll(',', ''));
    }
    return currentPrice;
  }, [position, currentPrice]);

  const leverageForEdit = useMemo(
    () => position?.leverage?.value ?? 1,
    [position],
  );

  const positionDirection = useMemo(() => {
    if (!position) {
      return 'long';
    }
    return Number.parseFloat(position.size) >= 0 ? 'long' : 'short';
  }, [position]);

  const formatEditPrice = useCallback(
    (value: number): string =>
      formatNumber(value, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [formatNumber],
  );

  /**
   * Convert a target price to a RoE% for display.
   * RoE% = ((targetPrice - entryPrice) / entryPrice) * leverage * 100
   */
  const priceToPercentForEdit = useCallback(
    (price: string, isTP: boolean): string => {
      if (!price || !entryPriceForEdit) {
        return '';
      }
      const cleanPrice = price.replaceAll(',', '');
      const priceNum = Number.parseFloat(cleanPrice);
      if (Number.isNaN(priceNum) || priceNum <= 0) {
        return '';
      }
      const diff = priceNum - entryPriceForEdit;
      const percentChange = (diff / entryPriceForEdit) * leverageForEdit * 100;
      if (positionDirection === 'long') {
        return formatEditPercent(isTP ? percentChange : -percentChange);
      }
      return formatEditPercent(isTP ? -percentChange : percentChange);
    },
    [entryPriceForEdit, leverageForEdit, positionDirection],
  );

  /**
   * Convert a RoE% to a target price.
   * targetPrice = entryPrice * (1 + roePercent / (leverage * 100))
   */
  const percentToPriceForEdit = useCallback(
    (percent: number, isTP: boolean): string => {
      if (!entryPriceForEdit || percent === 0) {
        return '';
      }
      const priceChangeRatio = percent / (leverageForEdit * 100);
      let multiplier: number;
      if (positionDirection === 'long') {
        multiplier = isTP ? 1 + priceChangeRatio : 1 - priceChangeRatio;
      } else {
        multiplier = isTP ? 1 - priceChangeRatio : 1 + priceChangeRatio;
      }
      const price = entryPriceForEdit * multiplier;
      return formatEditPrice(price);
    },
    [entryPriceForEdit, leverageForEdit, positionDirection, formatEditPrice],
  );

  const editingTpPercent = useMemo(
    () => priceToPercentForEdit(editingTpPrice, true),
    [priceToPercentForEdit, editingTpPrice],
  );

  const editingSlPercent = useMemo(
    () => priceToPercentForEdit(editingSlPrice, false),
    [priceToPercentForEdit, editingSlPrice],
  );

  const signedSize = useMemo(
    () => Number.parseFloat(position.size.replaceAll(',', '')) || 0,
    [position.size],
  );

  const estimatedPnlAtTp = useMemo(() => {
    const clean = editingTpPrice.replaceAll(',', '').trim();
    if (!clean) {
      return null;
    }
    const exitPrice = Number.parseFloat(clean);
    if (Number.isNaN(exitPrice) || exitPrice <= 0 || !entryPriceForEdit) {
      return null;
    }
    const grossPnl = signedSize * (exitPrice - entryPriceForEdit);
    const closingFee = Math.abs(signedSize) * exitPrice * FEE_RATES.taker;
    return grossPnl - closingFee;
  }, [editingTpPrice, signedSize, entryPriceForEdit]);

  const estimatedPnlAtSl = useMemo(() => {
    const clean = editingSlPrice.replaceAll(',', '').trim();
    if (!clean) {
      return null;
    }
    const exitPrice = Number.parseFloat(clean);
    if (Number.isNaN(exitPrice) || exitPrice <= 0 || !entryPriceForEdit) {
      return null;
    }
    const grossPnl = signedSize * (exitPrice - entryPriceForEdit);
    const closingFee = Math.abs(signedSize) * exitPrice * FEE_RATES.taker;
    return grossPnl - closingFee;
  }, [editingSlPrice, signedSize, entryPriceForEdit]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleTpPresetClick = useCallback(
    (percent: number) => {
      const newPrice = percentToPriceForEdit(percent, true);
      setEditingTpPrice(newPrice);
      // Sync raw percent in case the field is focused
      setRawTpPercent(String(percent));
    },
    [percentToPriceForEdit],
  );

  const handleSlPresetClick = useCallback(
    (percent: number) => {
      const newPrice = percentToPriceForEdit(percent, false);
      setEditingSlPrice(newPrice);
      setRawSlPercent(String(percent));
    },
    [percentToPriceForEdit],
  );

  const handleTpPercentInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      if (value === '' || /^-?\d*(?:\.\d*)?$/u.test(value)) {
        setRawTpPercent(value);
        const numValue = Number.parseFloat(value);
        if (value === '' || value === '-') {
          setEditingTpPrice('');
        } else if (!Number.isNaN(numValue)) {
          const newPrice = percentToPriceForEdit(numValue, true);
          setEditingTpPrice(newPrice);
        }
      }
    },
    [percentToPriceForEdit],
  );

  const handleTpPercentFocus = useCallback(() => {
    setRawTpPercent(editingTpPercent);
    setIsTpPercentFocused(true);
  }, [editingTpPercent]);

  const handleTpPercentBlur = useCallback(() => {
    setIsTpPercentFocused(false);
    setRawTpPercent('');
  }, []);

  const handleSlPercentInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      if (value === '' || /^-?\d*(?:\.\d*)?$/u.test(value)) {
        setRawSlPercent(value);
        const numValue = Number.parseFloat(value);
        if (value === '' || value === '-') {
          setEditingSlPrice('');
        } else if (!Number.isNaN(numValue)) {
          const newPrice = percentToPriceForEdit(numValue, false);
          setEditingSlPrice(newPrice);
        }
      }
    },
    [percentToPriceForEdit],
  );

  const handleSlPercentFocus = useCallback(() => {
    setRawSlPercent(editingSlPercent);
    setIsSlPercentFocused(true);
  }, [editingSlPercent]);

  const handleSlPercentBlur = useCallback(() => {
    setIsSlPercentFocused(false);
    setRawSlPercent('');
  }, []);

  const handleTpPriceBlur = useCallback(() => {
    if (editingTpPrice) {
      const numValue = Number.parseFloat(editingTpPrice.replaceAll(',', ''));
      if (!Number.isNaN(numValue) && numValue > 0) {
        setEditingTpPrice(formatEditPrice(numValue));
      }
    }
  }, [editingTpPrice, formatEditPrice]);

  const handleSlPriceBlur = useCallback(() => {
    if (editingSlPrice) {
      const numValue = Number.parseFloat(editingSlPrice.replaceAll(',', ''));
      if (!Number.isNaN(numValue) && numValue > 0) {
        setEditingSlPrice(formatEditPrice(numValue));
      }
    }
  }, [editingSlPrice, formatEditPrice]);

  const handleSave = useCallback(async () => {
    if (!isEligible || !position) {
      return;
    }
    setIsSaving(true);

    const { takeProfitPrice: cleanTpPrice, stopLossPrice: cleanSlPrice } =
      normalizeTpslPrices({
        takeProfitPrice: editingTpPrice,
        stopLossPrice: editingSlPrice,
      });

    try {
      const result = await submitRequestToBackground<PerpsBackgroundResult>(
        'perpsUpdatePositionTPSL',
        [
          {
            symbol: position.symbol,
            takeProfitPrice: cleanTpPrice,
            stopLossPrice: cleanSlPrice,
          },
        ],
      );
      if (!result.success) {
        throw new Error(result.error || 'Failed to update TP/SL');
      }

      const streamManager = getPerpsStreamManager();
      streamManager.setOptimisticTPSL(
        position.symbol,
        cleanTpPrice,
        cleanSlPrice,
      );
      const currentPositions = streamManager.positions.getCachedData();
      const optimisticallyUpdatedPositions = currentPositions.map((p) =>
        p.symbol === position.symbol
          ? {
              ...p,
              takeProfitPrice: cleanTpPrice,
              stopLossPrice: cleanSlPrice,
            }
          : p,
      );
      streamManager.positions.pushData(optimisticallyUpdatedPositions);

      setTimeout(async () => {
        try {
          const freshPositions = await submitRequestToBackground<
            PerpsPosition[]
          >('perpsGetPositions', [{ skipCache: true }]);
          streamManager.pushPositionsWithOverrides(freshPositions);
        } catch (e) {
          console.warn('[Perps] Delayed TP/SL refetch failed:', e);
        }
      }, 2500);

      replacePerpsToastByKey({
        key: PERPS_TOAST_KEYS.UPDATE_SUCCESS,
      });
      onClose();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred';
      replacePerpsToastByKey({
        key: PERPS_TOAST_KEYS.UPDATE_FAILED,
        description: errorMessage,
      });
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  }, [
    editingSlPrice,
    editingTpPrice,
    isEligible,
    onClose,
    position,
    replacePerpsToastByKey,
  ]);

  useLayoutEffect(() => {
    onSubmitStateChange?.({
      onSubmit: handleSave,
      isSaving,
      submitDisabled: !isEligible || isSaving,
      submitButtonTitle: isEligible ? undefined : t('perpsGeoBlockedTooltip'),
    });
  }, [onSubmitStateChange, handleSave, isSaving, isEligible, t]);

  return (
    <Box flexDirection={BoxFlexDirection.Column} gap={4}>
      {/* Take Profit */}
      <Box flexDirection={BoxFlexDirection.Column} gap={2}>
        <Text
          variant={TextVariant.BodySm}
          color={TextColor.TextAlternative}
          fontWeight={FontWeight.Medium}
        >
          {t('perpsTakeProfit')}
        </Text>
        <Box flexDirection={BoxFlexDirection.Row} gap={2}>
          {TP_PRESETS.map((preset) => (
            <Box
              key={`tp-edit-${preset}`}
              onClick={isSaving ? undefined : () => handleTpPresetClick(preset)}
              className={
                isSaving
                  ? 'flex-1 py-1.5 rounded-lg bg-muted text-center opacity-50 cursor-not-allowed pointer-events-none'
                  : 'flex-1 py-1.5 rounded-lg bg-background-default cursor-pointer text-center hover:bg-muted-hover active:bg-muted-pressed border border-muted transition-colors duration-150'
              }
            >
              <Text
                variant={TextVariant.BodySm}
                color={TextColor.TextAlternative}
              >
                +{preset}%
              </Text>
            </Box>
          ))}
        </Box>
        <Box
          flexDirection={BoxFlexDirection.Row}
          gap={2}
          alignItems={BoxAlignItems.Center}
        >
          <Box className="flex-1">
            <TextField
              size={TextFieldSize.Md}
              value={editingTpPrice}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const { value } = e.target;
                if (value === '' || /^[\d,]*(?:\.\d*)?$/u.test(value)) {
                  setEditingTpPrice(value);
                }
              }}
              onBlur={handleTpPriceBlur}
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
          <Box className="flex-1">
            <TextField
              size={TextFieldSize.Md}
              value={isTpPercentFocused ? rawTpPercent : editingTpPercent}
              onChange={handleTpPercentInputChange}
              onFocus={handleTpPercentFocus}
              onBlur={handleTpPercentBlur}
              placeholder="0"
              borderRadius={BorderRadius.MD}
              borderWidth={0}
              backgroundColor={BackgroundColor.backgroundMuted}
              className="w-full"
              disabled={isSaving}
              endAccessory={
                <Text
                  variant={TextVariant.BodyMd}
                  color={TextColor.TextAlternative}
                >
                  %
                </Text>
              }
            />
          </Box>
        </Box>
        {estimatedPnlAtTp !== null && (
          <Box
            flexDirection={BoxFlexDirection.Row}
            justifyContent={BoxJustifyContent.Between}
            alignItems={BoxAlignItems.Center}
            data-testid="perps-update-tpsl-estimated-tp-pnl-row"
          >
            <Text
              variant={TextVariant.BodyXs}
              color={TextColor.TextAlternative}
            >
              {t('perpsEstimatedPnlAtTakeProfit')}
            </Text>
            <Text
              variant={TextVariant.BodySm}
              fontWeight={FontWeight.Medium}
              color={getPnlDisplayColor(estimatedPnlAtTp)}
            >
              {estimatedPnlAtTp >= 0 ? '+' : '-'}
              {formatCurrencyWithMinThreshold(
                Math.abs(estimatedPnlAtTp),
                'USD',
              )}
            </Text>
          </Box>
        )}
      </Box>

      {/* Stop Loss */}
      <Box flexDirection={BoxFlexDirection.Column} gap={2}>
        <Text
          variant={TextVariant.BodySm}
          color={TextColor.TextAlternative}
          fontWeight={FontWeight.Medium}
        >
          {t('perpsStopLoss')}
        </Text>
        <Box flexDirection={BoxFlexDirection.Row} gap={2}>
          {SL_PRESETS.map((preset) => (
            <Box
              key={`sl-edit-${preset}`}
              onClick={isSaving ? undefined : () => handleSlPresetClick(preset)}
              className={
                isSaving
                  ? 'flex-1 py-1.5 rounded-lg bg-muted text-center opacity-50 cursor-not-allowed pointer-events-none'
                  : 'flex-1 py-1.5 rounded-lg bg-background-default cursor-pointer text-center hover:bg-muted-hover active:bg-muted-pressed border border-muted transition-colors duration-150'
              }
            >
              <Text
                variant={TextVariant.BodySm}
                color={TextColor.TextAlternative}
              >
                -{preset}%
              </Text>
            </Box>
          ))}
        </Box>
        <Box
          flexDirection={BoxFlexDirection.Row}
          gap={2}
          alignItems={BoxAlignItems.Center}
        >
          <Box className="flex-1">
            <TextField
              size={TextFieldSize.Md}
              value={editingSlPrice}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const { value } = e.target;
                if (value === '' || /^[\d,]*(?:\.\d*)?$/u.test(value)) {
                  setEditingSlPrice(value);
                }
              }}
              onBlur={handleSlPriceBlur}
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
          <Box className="flex-1">
            <TextField
              size={TextFieldSize.Md}
              value={isSlPercentFocused ? rawSlPercent : editingSlPercent}
              onChange={handleSlPercentInputChange}
              onFocus={handleSlPercentFocus}
              onBlur={handleSlPercentBlur}
              placeholder="0"
              borderRadius={BorderRadius.MD}
              borderWidth={0}
              backgroundColor={BackgroundColor.backgroundMuted}
              className="w-full"
              disabled={isSaving}
              endAccessory={
                <Text
                  variant={TextVariant.BodyMd}
                  color={TextColor.TextAlternative}
                >
                  %
                </Text>
              }
            />
          </Box>
        </Box>
        {estimatedPnlAtSl !== null && (
          <Box
            flexDirection={BoxFlexDirection.Row}
            justifyContent={BoxJustifyContent.Between}
            alignItems={BoxAlignItems.Center}
            data-testid="perps-update-tpsl-estimated-sl-pnl-row"
          >
            <Text
              variant={TextVariant.BodyXs}
              color={TextColor.TextAlternative}
            >
              {t('perpsEstimatedPnlAtStopLoss')}
            </Text>
            <Text
              variant={TextVariant.BodySm}
              fontWeight={FontWeight.Medium}
              color={getPnlDisplayColor(estimatedPnlAtSl)}
            >
              {estimatedPnlAtSl >= 0 ? '+' : '-'}
              {formatCurrencyWithMinThreshold(
                Math.abs(estimatedPnlAtSl),
                'USD',
              )}
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
};
