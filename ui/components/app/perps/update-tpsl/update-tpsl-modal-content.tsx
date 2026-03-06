import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
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
import { useFormatters } from '../../../../hooks/useFormatters';
import { usePerpsEligibility } from '../../../../hooks/perps';
import { submitRequestToBackground } from '../../../../store/background-connection';
import { getPerpsStreamManager } from '../../../../providers/perps';
import { usePerpsToast } from '../perps-toast';
import { PERPS_TOAST_KEYS } from '../perps-toast/perps-toast-provider';
import type { Position, PerpsBackgroundResult } from '../types';

const TP_PRESETS = [10, 25, 50, 100];
const SL_PRESETS = [10, 25, 50, 75];

export type UpdateTPSLModalContentProps = {
  position: Position;
  currentPrice: number;
  onClose: () => void;
  isPerpsInAppToastsEnabled?: boolean;
};

/**
 * TP/SL form content: presets, price/percent inputs, save.
 * Used inside UpdateTPSLModal. Initializes from position when modal opens.
 * @param options0
 * @param options0.position
 * @param options0.currentPrice
 * @param options0.onClose
 * @param options0.isPerpsInAppToastsEnabled
 */
export const UpdateTPSLModalContent: React.FC<UpdateTPSLModalContentProps> = ({
  position,
  currentPrice,
  onClose,
  isPerpsInAppToastsEnabled = false,
}) => {
  const t = useI18nContext();
  const { formatNumber } = useFormatters();
  const { isEligible } = usePerpsEligibility();
  const { replacePerpsToastByKey } = usePerpsToast();

  const [editingTpPrice, setEditingTpPrice] = useState<string>('');
  const [editingSlPrice, setEditingSlPrice] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [tpslError, setTpslError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const delayedRefetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const entryPriceForEdit = useMemo(() => {
    if (position?.entryPrice) {
      return parseFloat(position.entryPrice.replace(/,/gu, ''));
    }
    return currentPrice;
  }, [position, currentPrice]);

  const positionDirection = useMemo(() => {
    if (!position) {
      return 'long';
    }
    return parseFloat(position.size) >= 0 ? 'long' : 'short';
  }, [position]);

  const formatEditPrice = useCallback(
    (value: number): string =>
      formatNumber(value, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [formatNumber],
  );

  const formatEditPercent = useCallback(
    (value: number): string =>
      formatNumber(value, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }),
    [formatNumber],
  );

  const priceToPercentForEdit = useCallback(
    (price: string, isTP: boolean): string => {
      if (!price || !entryPriceForEdit) {
        return '';
      }
      const cleanPrice = price.replace(/,/gu, '');
      const priceNum = parseFloat(cleanPrice);
      if (Number.isNaN(priceNum) || priceNum <= 0) {
        return '';
      }
      const diff = priceNum - entryPriceForEdit;
      const percentChange = (diff / entryPriceForEdit) * 100;
      if (positionDirection === 'long') {
        return formatEditPercent(isTP ? percentChange : -percentChange);
      }
      return formatEditPercent(isTP ? -percentChange : percentChange);
    },
    [entryPriceForEdit, positionDirection, formatEditPercent],
  );

  const percentToPriceForEdit = useCallback(
    (percent: number, isTP: boolean): string => {
      if (!entryPriceForEdit || percent === 0) {
        return '';
      }
      let multiplier: number;
      if (positionDirection === 'long') {
        multiplier = isTP ? 1 + percent / 100 : 1 - percent / 100;
      } else {
        multiplier = isTP ? 1 - percent / 100 : 1 + percent / 100;
      }
      const price = entryPriceForEdit * multiplier;
      return formatEditPrice(price);
    },
    [entryPriceForEdit, positionDirection, formatEditPrice],
  );

  const editingTpPercent = useMemo(
    () => priceToPercentForEdit(editingTpPrice, true),
    [priceToPercentForEdit, editingTpPrice],
  );

  const editingSlPercent = useMemo(
    () => priceToPercentForEdit(editingSlPrice, false),
    [priceToPercentForEdit, editingSlPrice],
  );

  useEffect(() => {
    if (position) {
      setEditingTpPrice(position.takeProfitPrice ?? '');
      setEditingSlPrice(position.stopLossPrice ?? '');
      setTpslError(null);
    }
  }, [position]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (delayedRefetchTimeoutRef.current) {
        clearTimeout(delayedRefetchTimeoutRef.current);
        delayedRefetchTimeoutRef.current = null;
      }
    };
  }, []);

  const handleTpPresetClick = useCallback(
    (percent: number) => {
      const newPrice = percentToPriceForEdit(percent, true);
      setEditingTpPrice(newPrice);
    },
    [percentToPriceForEdit],
  );

  const handleSlPresetClick = useCallback(
    (percent: number) => {
      const newPrice = percentToPriceForEdit(percent, false);
      setEditingSlPrice(newPrice);
    },
    [percentToPriceForEdit],
  );

  const handleTpPercentInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      if (value === '' || /^-?\d*(?:\.\d*)?$/u.test(value)) {
        const numValue = parseFloat(value);
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

  const handleSlPercentInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      if (value === '' || /^-?\d*(?:\.\d*)?$/u.test(value)) {
        const numValue = parseFloat(value);
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

  const handleTpPriceBlur = useCallback(() => {
    if (editingTpPrice) {
      const numValue = parseFloat(editingTpPrice.replace(/,/gu, ''));
      if (!Number.isNaN(numValue) && numValue > 0) {
        setEditingTpPrice(formatEditPrice(numValue));
      }
    }
  }, [editingTpPrice, formatEditPrice]);

  const handleSlPriceBlur = useCallback(() => {
    if (editingSlPrice) {
      const numValue = parseFloat(editingSlPrice.replace(/,/gu, ''));
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
    setTpslError(null);

    const cleanTpPrice = editingTpPrice.replace(/,/gu, '').trim();
    const cleanSlPrice = editingSlPrice.replace(/,/gu, '').trim();

    try {
      const result = await submitRequestToBackground<PerpsBackgroundResult>(
        'perpsUpdatePositionTPSL',
        [
          {
            symbol: position.symbol,
            takeProfitPrice: cleanTpPrice || undefined,
            stopLossPrice: cleanSlPrice || undefined,
          },
        ],
      );
      if (!result.success) {
        throw new Error(result.error || 'Failed to update TP/SL');
      }

      const streamManager = getPerpsStreamManager();
      streamManager.setOptimisticTPSL(
        position.symbol,
        cleanTpPrice || undefined,
        cleanSlPrice || undefined,
      );
      const currentPositions = streamManager.positions.getCachedData();
      const optimisticallyUpdatedPositions = currentPositions.map((p) =>
        p.symbol === position.symbol
          ? {
              ...p,
              takeProfitPrice: cleanTpPrice || undefined,
              stopLossPrice: cleanSlPrice || undefined,
            }
          : p,
      );
      streamManager.positions.pushData(optimisticallyUpdatedPositions);

      delayedRefetchTimeoutRef.current = setTimeout(async () => {
        try {
          const freshPositions = await submitRequestToBackground<
            PerpsPosition[]
          >('perpsGetPositions', [{ skipCache: true }]);
          streamManager.pushPositionsWithOverrides(freshPositions);
        } catch (e) {
          console.warn('[Perps] Delayed TP/SL refetch failed:', e);
        }
      }, 2500);

      if (isPerpsInAppToastsEnabled) {
        replacePerpsToastByKey({
          key: PERPS_TOAST_KEYS.UPDATE_SUCCESS,
        });
      }
      onClose();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred';
      if (isPerpsInAppToastsEnabled) {
        if (isMountedRef.current) {
          setTpslError(null);
        }
        replacePerpsToastByKey({
          key: PERPS_TOAST_KEYS.UPDATE_FAILED,
          description: errorMessage,
        });
      } else if (isMountedRef.current) {
        setTpslError(errorMessage);
      }
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  }, [
    editingSlPrice,
    editingTpPrice,
    isPerpsInAppToastsEnabled,
    isEligible,
    onClose,
    position,
    replacePerpsToastByKey,
  ]);

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
              value={editingTpPercent}
              onChange={handleTpPercentInputChange}
              placeholder="0.0"
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
              value={editingSlPercent}
              onChange={handleSlPercentInputChange}
              placeholder="0.0"
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
      </Box>

      {!isPerpsInAppToastsEnabled && tpslError && (
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
            {tpslError}
          </Text>
        </Box>
      )}

      <Button
        variant={ButtonVariant.Primary}
        size={ButtonSize.Md}
        onClick={handleSave}
        disabled={!isEligible || isSaving}
        title={isEligible ? undefined : t('perpsGeoBlockedTooltip')}
        className={
          isSaving || !isEligible
            ? 'w-full opacity-70 cursor-not-allowed'
            : 'w-full'
        }
      >
        {isSaving ? t('perpsSubmitting') : t('perpsSaveChanges')}
      </Button>
    </Box>
  );
};
