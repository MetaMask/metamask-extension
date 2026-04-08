import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
} from '@metamask/design-system-react';
import type { Position as PerpsPosition } from '@metamask/perps-controller';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  ModalContentSize,
  ModalBody,
  ModalFooter,
} from '../../../component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { submitRequestToBackground } from '../../../../store/background-connection';
import { getPerpsStreamManager } from '../../../../providers/perps';
import { getPositionDirection } from '../utils';
import { handlePerpsError } from '../utils/translate-perps-error';
import { PERPS_TOAST_KEYS, usePerpsToast } from '../perps-toast';
import type { Position } from '../types';

export type ReversePositionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  position: Position;
  currentPrice: number;
};

/**
 * Builds a position payload for `perpsFlipPosition`. The controller expects
 * `leverage.value`; normalize when the stream sent a primitive leverage.
 *
 * @param pos - UI position from props
 * @returns Position safe to pass to the background flip RPC
 */
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

/**
 * Modal to reverse a position (Long -> Short or Short -> Long).
 * Shows Direction, Est. size, Fees and Cancel/Save.
 * Save calls `perpsFlipPosition` (single venue order via PerpsController; not close+open).
 * @param options0
 * @param options0.isOpen
 * @param options0.onClose
 * @param options0.position
 * @param options0.currentPrice
 */
export const ReversePositionModal: React.FC<ReversePositionModalProps> = ({
  isOpen,
  onClose,
  position,
  currentPrice: _currentPrice,
}) => {
  const t = useI18nContext();
  const { replacePerpsToastByKey } = usePerpsToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const direction = getPositionDirection(position.size);
  const directionLabel =
    direction === 'long'
      ? `${t('perpsLong')} → ${t('perpsShort')}`
      : `${t('perpsShort')} → ${t('perpsLong')}`;
  const sizeNum = Math.abs(parseFloat(position.size));
  const estSizeLabel = `${sizeNum.toFixed(2)} ${position.symbol}`;

  const positionForFlip = useMemo(
    () => toFlipPositionPayload(position),
    [position],
  );

  const handleSave = useCallback(async () => {
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
      const message = handlePerpsError(err, t as (key: string) => string);
      setError(message);
      replacePerpsToastByKey({
        key: PERPS_TOAST_KEYS.REVERSE_FAILED,
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [onClose, position.symbol, positionForFlip, replacePerpsToastByKey, t]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      data-testid="perps-reverse-position-modal"
    >
      <ModalOverlay />
      <ModalContent size={ModalContentSize.Sm}>
        <ModalHeader onClose={onClose}>{t('perpsReversePosition')}</ModalHeader>
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
              <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
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
              <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
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
              <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
                —
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
            children: isSubmitting ? t('perpsSubmitting') : t('save'),
            disabled: isSubmitting,
          }}
        />
      </ModalContent>
    </Modal>
  );
};
