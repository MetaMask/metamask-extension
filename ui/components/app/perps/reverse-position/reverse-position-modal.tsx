import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Box,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
  Text,
  TextVariant,
  TextAlign,
  TextColor,
  FontWeight,
  Icon,
  IconName,
  IconSize,
} from '@metamask/design-system-react';
import type { Position as PerpsPosition } from '@metamask/perps-controller';
import {
  formatPerpsFiat,
  formatPositionSize,
  PRICE_RANGES_MINIMAL_VIEW,
} from '../../../../../shared/lib/perps-formatters';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  ModalContentSize,
  ModalBody,
  ModalFooter,
} from '../../../component-library';
import { MetaMetricsEventName } from '../../../../../shared/constants/metametrics';
import {
  PERPS_EVENT_PROPERTY,
  PERPS_EVENT_VALUE,
} from '../../../../../shared/constants/perps-events';
import {
  usePerpsEligibility,
  usePerpsEventTracking,
} from '../../../../hooks/perps';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { submitRequestToBackground } from '../../../../store/background-connection';
import { getPerpsStreamManager } from '../../../../providers/perps';
import { getPositionDirection } from '../utils';
import { handlePerpsError } from '../utils/translate-perps-error';
import { PERPS_TOAST_KEYS, usePerpsToast } from '../perps-toast';
import { PerpsGeoBlockModal } from '../perps-geo-block-modal';
import { usePerpsOrderFees } from '../../../../hooks/perps/usePerpsOrderFees';
import type { Position } from '../types';

export type ReversePositionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  position: Position;
  currentPrice: number;
  sizeDecimals?: number;
};

function toFlipPositionPayload(pos: Position): Position {
  if (typeof pos.leverage === 'object' && pos.leverage !== null) {
    return pos;
  }
  const value = typeof pos.leverage === 'number' ? pos.leverage : 1;
  return {
    ...pos,
    leverage: { type: 'cross', value },
  };
}

export const ReversePositionModal: React.FC<ReversePositionModalProps> = ({
  isOpen,
  onClose,
  position,
  currentPrice,
  sizeDecimals,
}) => {
  const t = useI18nContext();
  const { isEligible } = usePerpsEligibility();
  const { track } = usePerpsEventTracking();
  const [isGeoBlockModalOpen, setIsGeoBlockModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsGeoBlockModalOpen(false);
    }
  }, [isOpen]);

  usePerpsEventTracking({
    eventName: MetaMetricsEventName.PerpsScreenViewed,
    conditions: isOpen,
    properties: {
      [PERPS_EVENT_PROPERTY.SCREEN_TYPE]:
        PERPS_EVENT_VALUE.SCREEN_TYPE.FLIP_POSITION,
      [PERPS_EVENT_PROPERTY.ASSET]: position.symbol,
      [PERPS_EVENT_PROPERTY.SOURCE]: PERPS_EVENT_VALUE.SOURCE.ASSET_DETAILS,
    },
  });
  const { replacePerpsToastByKey } = usePerpsToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const direction = getPositionDirection(position.size);
  const directionLabel =
    direction === 'long'
      ? `${t('perpsLong')} → ${t('perpsShort')}`
      : `${t('perpsShort')} → ${t('perpsLong')}`;
  const sizeNum = Math.abs(parseFloat(position.size));
  const estSizeLabel = `${formatPositionSize(sizeNum, sizeDecimals)} ${position.symbol}`;

  const {
    feeRate,
    isLoading: isFeeLoading,
    hasError: hasFeeError,
  } = usePerpsOrderFees({
    symbol: position.symbol,
    orderType: 'market',
  });

  const estimatedFees = useMemo(
    () =>
      feeRate === undefined ? undefined : 2 * sizeNum * currentPrice * feeRate,
    [sizeNum, currentPrice, feeRate],
  );

  const shouldShowFeePlaceholder =
    isFeeLoading || hasFeeError || estimatedFees === undefined;

  const positionForFlip = useMemo(
    () => toFlipPositionPayload(position),
    [position],
  );

  const handleSave = useCallback(async () => {
    if (!isEligible) {
      setIsGeoBlockModalOpen(true);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    replacePerpsToastByKey({ key: PERPS_TOAST_KEYS.REVERSE_IN_PROGRESS });

    try {
      const flipResult = await submitRequestToBackground<{
        success: boolean;
        error?: string;
      }>('perpsFlipPosition', [
        { symbol: position.symbol, position: positionForFlip },
      ]);
      if (flipResult?.success !== true) {
        throw new Error(flipResult?.error || 'Failed to flip position');
      }
      const streamManager = getPerpsStreamManager();
      const freshPositions = await submitRequestToBackground<PerpsPosition[]>(
        'perpsGetPositions',
        [{ skipCache: true }],
      );
      streamManager.pushPositionsWithOverrides(freshPositions);

      replacePerpsToastByKey({ key: PERPS_TOAST_KEYS.REVERSE_SUCCESS });
      onClose();
    } catch (err) {
      const raw =
        err instanceof Error ? err.message : 'An unknown error occurred';
      track(MetaMetricsEventName.PerpsError, {
        [PERPS_EVENT_PROPERTY.ERROR_TYPE]: PERPS_EVENT_VALUE.ERROR_TYPE.BACKEND,
        [PERPS_EVENT_PROPERTY.ERROR_MESSAGE]: raw,
      });
      const message = handlePerpsError(err, t as (key: string) => string);
      setError(message);
      replacePerpsToastByKey({
        key: PERPS_TOAST_KEYS.REVERSE_FAILED,
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isEligible,
    onClose,
    position.symbol,
    positionForFlip,
    replacePerpsToastByKey,
    track,
    t,
  ]);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        data-testid="perps-reverse-position-modal"
      >
        <ModalOverlay />
        <ModalContent size={ModalContentSize.Sm}>
          <ModalHeader onClose={onClose}>
            <Box
              flexDirection={BoxFlexDirection.Column}
              alignItems={BoxAlignItems.Center}
              gap={2}
            >
              <Icon name={IconName.SwapHorizontal} size={IconSize.Xl} />
              <Text
                variant={TextVariant.HeadingSm}
                textAlign={TextAlign.Center}
              >
                {t('perpsReversePosition')}
              </Text>
            </Box>
          </ModalHeader>
          <ModalBody>
            <Box flexDirection={BoxFlexDirection.Column} gap={4}>
              <Box
                flexDirection={BoxFlexDirection.Row}
                justifyContent={BoxJustifyContent.Between}
                alignItems={BoxAlignItems.Center}
              >
                <Text
                  variant={TextVariant.BodySm}
                  color={TextColor.TextAlternative}
                >
                  {t('perpsDirection')}
                </Text>
                <Text
                  variant={TextVariant.BodySm}
                  fontWeight={FontWeight.Medium}
                >
                  {directionLabel}
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
                  {t('perpsEstSize')}
                </Text>
                <Text
                  variant={TextVariant.BodySm}
                  fontWeight={FontWeight.Medium}
                  data-testid="perps-reverse-est-size-value"
                >
                  {estSizeLabel}
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
                  {t('perpsFees')}
                </Text>
                <Text
                  variant={TextVariant.BodySm}
                  fontWeight={FontWeight.Medium}
                  data-testid="perps-reverse-fee-value"
                >
                  {shouldShowFeePlaceholder
                    ? '--'
                    : formatPerpsFiat(estimatedFees, {
                        ranges: PRICE_RANGES_MINIMAL_VIEW,
                      })}
                </Text>
              </Box>
              {error && (
                <Box
                  className="bg-error-muted rounded-lg px-3 py-2"
                  flexDirection={BoxFlexDirection.Row}
                  alignItems={BoxAlignItems.Center}
                >
                  <Text
                    variant={TextVariant.BodySm}
                    color={TextColor.ErrorDefault}
                  >
                    {error}
                  </Text>
                </Box>
              )}
            </Box>
          </ModalBody>
          <ModalFooter
            onCancel={onClose}
            onSubmit={handleSave}
            cancelButtonProps={{
              'data-testid': 'perps-reverse-position-modal-cancel',
              children: t('cancel'),
              disabled: isSubmitting,
            }}
            submitButtonProps={{
              'data-testid': 'perps-reverse-position-modal-save',
              children: isSubmitting ? t('perpsSubmitting') : t('confirm'),
              disabled: isSubmitting,
            }}
          />
        </ModalContent>
      </Modal>
      <PerpsGeoBlockModal
        isOpen={isGeoBlockModalOpen}
        onClose={() => setIsGeoBlockModalOpen(false)}
      />
    </>
  );
};
