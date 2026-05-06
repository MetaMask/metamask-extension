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
import {
  formatPerpsFiat,
  PRICE_RANGES_MINIMAL_VIEW,
} from '../../../../../shared/lib/perps-formatters';
import {
  PERPS_EVENT_PROPERTY,
  PERPS_EVENT_VALUE,
} from '../../../../../shared/constants/perps-events';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { TextField, TextFieldSize } from '../../../component-library';
import {
  BorderRadius,
  BackgroundColor,
} from '../../../../helpers/constants/design-system';
import {
  usePerpsEligibility,
  usePerpsEventTracking,
} from '../../../../hooks/perps';
import { usePerpsOrderFees } from '../../../../hooks/perps/usePerpsOrderFees';
import { MetaMetricsEventName } from '../../../../../shared/constants/metametrics';
import { submitRequestToBackground } from '../../../../store/background-connection';
import { getPerpsStreamManager } from '../../../../providers/perps';
import { usePerpsToast } from '../perps-toast';
import { PERPS_TOAST_KEYS } from '../perps-toast/perps-toast-provider';
import type { Position, PerpsBackgroundResult } from '../types';
import {
  normalizeTpslPrices,
  deriveTpslType,
  formatRoePercent,
  getPnlDisplayColor,
} from '../utils';
import { PerpsGeoBlockModal } from '../perps-geo-block-modal';
import {
  isValidTakeProfitPrice,
  isValidStopLossPrice,
  getTakeProfitErrorDirection,
  getStopLossErrorDirection,
} from '../utils/tpslValidation';

// RoE (Return on Equity) preset percentages - matching mobile
const TP_PRESETS = [10, 25, 50, 100];
const SL_PRESETS = [5, 10, 25, 50];

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
  const { track } = usePerpsEventTracking();
  const { isEligible } = usePerpsEligibility();
  const { replacePerpsToastByKey } = usePerpsToast();
  const { feeRate: closingFeeRate } = usePerpsOrderFees({
    symbol: position.symbol,
    orderType: 'market',
  });
  const [isGeoBlockModalOpen, setIsGeoBlockModalOpen] = useState(false);

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
  // Exact preset percent values, kept until the user manually edits a field
  const [tpPresetPercent, setTpPresetPercent] = useState<string | null>(null);
  const [slPresetPercent, setSlPresetPercent] = useState<string | null>(null);

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
    (value: number): string => value.toFixed(2),
    [],
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
        return formatRoePercent(isTP ? percentChange : -percentChange);
      }
      return formatRoePercent(isTP ? -percentChange : percentChange);
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
    if (closingFeeRate === undefined) {
      return null;
    }
    const clean = editingTpPrice.replaceAll(',', '').trim();
    if (!clean) {
      return null;
    }
    const exitPrice = Number.parseFloat(clean);
    if (Number.isNaN(exitPrice) || exitPrice <= 0 || !entryPriceForEdit) {
      return null;
    }
    const grossPnl = signedSize * (exitPrice - entryPriceForEdit);
    const closingFee = Math.abs(signedSize) * exitPrice * closingFeeRate;
    return grossPnl - closingFee;
  }, [editingTpPrice, signedSize, entryPriceForEdit, closingFeeRate]);

  const estimatedPnlAtSl = useMemo(() => {
    if (closingFeeRate === undefined) {
      return null;
    }
    const clean = editingSlPrice.replaceAll(',', '').trim();
    if (!clean) {
      return null;
    }
    const exitPrice = Number.parseFloat(clean);
    if (Number.isNaN(exitPrice) || exitPrice <= 0 || !entryPriceForEdit) {
      return null;
    }
    const grossPnl = signedSize * (exitPrice - entryPriceForEdit);
    const closingFee = Math.abs(signedSize) * exitPrice * closingFeeRate;
    return grossPnl - closingFee;
  }, [editingSlPrice, signedSize, entryPriceForEdit, closingFeeRate]);

  const isTpInvalid = useMemo(
    () =>
      Boolean(
        editingTpPrice.replaceAll(',', '').trim() &&
          currentPrice > 0 &&
          !isValidTakeProfitPrice(editingTpPrice, {
            currentPrice,
            direction: positionDirection,
          }),
      ),
    [editingTpPrice, currentPrice, positionDirection],
  );

  const isSlInvalid = useMemo(
    () =>
      Boolean(
        editingSlPrice.replaceAll(',', '').trim() &&
          currentPrice > 0 &&
          !isValidStopLossPrice(editingSlPrice, {
            currentPrice,
            direction: positionDirection,
          }),
      ),
    [editingSlPrice, currentPrice, positionDirection],
  );

  const hasInvalidTPSL = isTpInvalid || isSlInvalid;

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleTpPresetClick = useCallback(
    (percent: number) => {
      const newPrice = percentToPriceForEdit(percent, true);
      setEditingTpPrice(newPrice);
      // Preserve the exact preset value for display — avoids round-trip drift
      // caused by the price being rounded to 2 decimal places
      const presetStr = String(percent);
      setRawTpPercent(presetStr);
      setTpPresetPercent(presetStr);
    },
    [percentToPriceForEdit],
  );

  const handleSlPresetClick = useCallback(
    (percent: number) => {
      const newPrice = percentToPriceForEdit(percent, false);
      setEditingSlPrice(newPrice);
      const presetStr = String(percent);
      setRawSlPercent(presetStr);
      setSlPresetPercent(presetStr);
    },
    [percentToPriceForEdit],
  );

  const handleTpPercentInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      if (value === '' || /^-?\d*(?:\.\d*)?$/u.test(value)) {
        setRawTpPercent(value);
        setTpPresetPercent(null);
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
    setRawTpPercent(tpPresetPercent ?? editingTpPercent);
    setIsTpPercentFocused(true);
  }, [tpPresetPercent, editingTpPercent]);

  const handleTpPercentBlur = useCallback(() => {
    setIsTpPercentFocused(false);
    setRawTpPercent('');
    setTpPresetPercent(null);
  }, []);

  const handleSlPercentInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      if (value === '' || /^-?\d*(?:\.\d*)?$/u.test(value)) {
        setRawSlPercent(value);
        setSlPresetPercent(null);
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
    setRawSlPercent(slPresetPercent ?? editingSlPercent);
    setIsSlPercentFocused(true);
  }, [slPresetPercent, editingSlPercent]);

  const handleSlPercentBlur = useCallback(() => {
    setIsSlPercentFocused(false);
    setRawSlPercent('');
    setSlPresetPercent(null);
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
    if (!isEligible) {
      setIsGeoBlockModalOpen(true);
      return;
    }
    if (!position) {
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
      const derivedTpslType = deriveTpslType({
        takeProfitPrice: cleanTpPrice,
        stopLossPrice: cleanSlPrice,
        hasExistingTpsl: Boolean(
          position.takeProfitPrice || position.stopLossPrice,
        ),
      });

      if (!result.success) {
        const failMessage = result.error || 'Failed to update TP/SL';
        track(MetaMetricsEventName.PerpsRiskManagement, {
          [PERPS_EVENT_PROPERTY.ASSET]: position.symbol,
          [PERPS_EVENT_PROPERTY.STATUS]: PERPS_EVENT_VALUE.STATUS.FAILED,
          [PERPS_EVENT_PROPERTY.FAILURE_REASON]: failMessage,
          [PERPS_EVENT_PROPERTY.ERROR_MESSAGE]: failMessage,
          [PERPS_EVENT_PROPERTY.TYPE]: derivedTpslType,
          [PERPS_EVENT_PROPERTY.SIZE]: position.size,
        });
        track(MetaMetricsEventName.PerpsError, {
          [PERPS_EVENT_PROPERTY.ERROR_TYPE]:
            PERPS_EVENT_VALUE.ERROR_TYPE.BACKEND,
          [PERPS_EVENT_PROPERTY.ERROR_MESSAGE]: failMessage,
        });
        replacePerpsToastByKey({
          key: PERPS_TOAST_KEYS.UPDATE_FAILED,
          description: failMessage,
        });
        return;
      }
      track(MetaMetricsEventName.PerpsRiskManagement, {
        [PERPS_EVENT_PROPERTY.ASSET]: position.symbol,
        [PERPS_EVENT_PROPERTY.STATUS]: PERPS_EVENT_VALUE.STATUS.SUCCESS,
        [PERPS_EVENT_PROPERTY.TYPE]: derivedTpslType,
        [PERPS_EVENT_PROPERTY.SIZE]: position.size,
      });
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
      track(MetaMetricsEventName.PerpsError, {
        [PERPS_EVENT_PROPERTY.ERROR_TYPE]: PERPS_EVENT_VALUE.ERROR_TYPE.BACKEND,
        [PERPS_EVENT_PROPERTY.ERROR_MESSAGE]: errorMessage,
      });
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
    track,
  ]);

  useLayoutEffect(() => {
    onSubmitStateChange?.({
      onSubmit: handleSave,
      isSaving,
      submitDisabled: isSaving || hasInvalidTPSL,
      submitButtonTitle: undefined,
    });
  }, [onSubmitStateChange, handleSave, isSaving, hasInvalidTPSL, t]);

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
                  setTpPresetPercent(null);
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
              value={
                isTpPercentFocused
                  ? rawTpPercent
                  : (tpPresetPercent ?? editingTpPercent)
              }
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
              {formatPerpsFiat(Math.abs(estimatedPnlAtTp), {
                ranges: PRICE_RANGES_MINIMAL_VIEW,
              })}
            </Text>
          </Box>
        )}
        {isTpInvalid && (
          <Text
            variant={TextVariant.BodyXs}
            color={TextColor.ErrorDefault}
            data-testid="tp-validation-error"
          >
            {t('perpsTakeProfitInvalidPrice', [
              getTakeProfitErrorDirection(positionDirection),
              'current',
            ])}
          </Text>
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
                  setSlPresetPercent(null);
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
              value={
                isSlPercentFocused
                  ? rawSlPercent
                  : (slPresetPercent ?? editingSlPercent)
              }
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
              {formatPerpsFiat(Math.abs(estimatedPnlAtSl), {
                ranges: PRICE_RANGES_MINIMAL_VIEW,
              })}
            </Text>
          </Box>
        )}
        {isSlInvalid && (
          <Text
            variant={TextVariant.BodyXs}
            color={TextColor.ErrorDefault}
            data-testid="sl-validation-error"
          >
            {t('perpsStopLossInvalidPrice', [
              getStopLossErrorDirection(positionDirection),
              'current',
            ])}
          </Text>
        )}
      </Box>
      <PerpsGeoBlockModal
        isOpen={isGeoBlockModalOpen}
        onClose={() => setIsGeoBlockModalOpen(false)}
      />
    </Box>
  );
};
