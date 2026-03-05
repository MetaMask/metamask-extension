import React, { useState, useCallback } from 'react';
import {
  Box,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
  Button,
  ButtonVariant,
  ButtonSize,
} from '@metamask/design-system-react';
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
import { getPerpsController } from '../../../../providers/perps';
import { getPerpsStreamManager } from '../../../../providers/perps/PerpsStreamManager';
import { getPositionDirection } from '../utils';
import type { Position } from '../types';

export type ReversePositionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  position: Position;
  currentPrice: number;
  selectedAddress: string;
};

/**
 * Modal to reverse a position (Long -> Short or Short -> Long).
 * Shows Direction, Est. size, Fees and Cancel/Save.
 * Save closes the position and places an order in the opposite direction (no dedicated reversePosition API).
 * @param options0
 * @param options0.isOpen
 * @param options0.onClose
 * @param options0.position
 * @param options0.currentPrice
 * @param options0.selectedAddress
 */
export const ReversePositionModal: React.FC<ReversePositionModalProps> = ({
  isOpen,
  onClose,
  position,
  currentPrice,
  selectedAddress,
}) => {
  const t = useI18nContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const direction = getPositionDirection(position.size);
  const oppositeDirection = direction === 'long' ? 'short' : 'long';
  const directionLabel =
    direction === 'long'
      ? `${t('perpsLong')} → ${t('perpsShort')}`
      : `${t('perpsShort')} → ${t('perpsLong')}`;
  const sizeNum = Math.abs(parseFloat(position.size));
  const estSizeLabel = `${sizeNum.toFixed(2)} ${position.symbol}`;

  const leverageValue =
    typeof position.leverage === 'object' && position.leverage !== null
      ? ((position.leverage as { value?: number }).value ?? 1)
      : 1;

  const handleSave = useCallback(async () => {
    if (!selectedAddress) {
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const controller = await getPerpsController(selectedAddress);
      const closeResult = await controller.closePosition({
        symbol: position.symbol,
        orderType: 'market',
        currentPrice,
      });
      if (!closeResult.success) {
        throw new Error(closeResult.error || 'Failed to close position');
      }
      const usdAmount = (sizeNum * currentPrice).toFixed(2);
      const orderResult = await controller.placeOrder({
        symbol: position.symbol,
        isBuy: oppositeDirection === 'long',
        size: sizeNum.toString(),
        orderType: 'market',
        usdAmount,
        currentPrice,
        leverage: leverageValue,
      });
      if (!orderResult.success) {
        throw new Error(orderResult.error || 'Failed to place order');
      }
      const streamManager = getPerpsStreamManager();
      const freshPositions = await controller.getPositions({ skipCache: true });
      streamManager.pushPositionsWithOverrides(freshPositions);
      onClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'An unknown error occurred';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    selectedAddress,
    position.symbol,
    currentPrice,
    sizeNum,
    oppositeDirection,
    leverageValue,
    onClose,
  ]);

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
              justifyContent={BoxJustifyContent.SpaceBetween}
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
              justifyContent={BoxJustifyContent.SpaceBetween}
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
              justifyContent={BoxJustifyContent.SpaceBetween}
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
                alignItems="center"
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
        <ModalFooter>
          <Button
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Lg}
            onClick={onClose}
            disabled={isSubmitting}
            data-testid="perps-reverse-position-modal-cancel"
          >
            {t('cancel')}
          </Button>
          <Button
            variant={ButtonVariant.Primary}
            size={ButtonSize.Lg}
            onClick={handleSave}
            disabled={isSubmitting}
            data-testid="perps-reverse-position-modal-save"
          >
            {isSubmitting ? t('perpsSubmitting') : t('save')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
