import React, { useCallback, useState } from 'react';
import {
  Box,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
  Icon,
  IconName,
  IconSize,
  IconColor,
  Button,
  ButtonVariant,
  ButtonSize,
} from '@metamask/design-system-react';
import type { Position } from '@metamask/perps-controller';
import {
  Modal,
  ModalContent,
  ModalOverlay,
  ModalBody,
  ModalHeader,
} from '../../../component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useFormatters } from '../../../../hooks/useFormatters';
import { submitRequestToBackground } from '../../../../store/background-connection';
import { getDisplayName } from '../utils';
import { FlexDirection } from '../../../../helpers/constants/design-system';

export type ReversePositionModalProps = {
  /** Whether the modal is open */
  isOpen: boolean;
  /** The position to reverse */
  position: Position;
  /** Current market price */
  currentPrice: number;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Callback after successfully reversing */
  onSuccess: () => void;
};

/**
 * ReversePositionModal - Confirmation modal for reversing a perps position.
 * Closes the current position and opens the opposite side at market price.
 *
 * @param props - Component props
 * @param props.isOpen - Whether the modal is open
 * @param props.position - The position to reverse
 * @param props.currentPrice - Current market price for fee estimation
 * @param props.onClose - Callback when modal is closed
 * @param props.onSuccess - Callback after successfully reversing
 */
const ReversePositionModal: React.FC<ReversePositionModalProps> = ({
  isOpen,
  position,
  currentPrice,
  onClose,
  onSuccess,
}) => {
  const t = useI18nContext();
  const { formatCurrencyWithMinThreshold } = useFormatters();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLong = parseFloat(position.size) >= 0;
  const absSize = Math.abs(parseFloat(position.size));
  const displayName = getDisplayName(position.symbol);

  const currentDirection = isLong ? t('perpsLong') : t('perpsShort');
  const newDirection = isLong ? t('perpsShort') : t('perpsLong');

  // Estimate fees: 2x taker fee (close + reopen), using ~0.05% per side as default
  const TAKER_FEE_RATE = 0.0005;
  const estimatedFees =
    currentPrice > 0
      ? formatCurrencyWithMinThreshold(
          absSize * currentPrice * TAKER_FEE_RATE * 2,
          'USD',
        )
      : '--';

  const handleReverse = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Step 1: Close the current position
      const closeResult = await submitRequestToBackground<{
        success: boolean;
        error?: string;
      }>('perpsClosePosition', [
        {
          symbol: position.symbol,
          orderType: 'market' as const,
          currentPrice,
        },
      ]);

      if (!closeResult.success) {
        throw new Error(closeResult.error ?? 'Failed to close position');
      }

      // Step 2: Open the opposite side with the same size
      const openResult = await submitRequestToBackground<{
        success: boolean;
        error?: string;
      }>('perpsPlaceOrder', [
        {
          symbol: position.symbol,
          isBuy: !isLong,
          size: absSize.toString(),
          orderType: 'market' as const,
          leverage: position.leverage.value,
          currentPrice,
          usdAmount: (absSize * currentPrice).toString(),
        },
      ]);

      if (!openResult.success) {
        throw new Error(openResult.error ?? 'Failed to open reversed position');
      }

      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred',
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [position, currentPrice, isLong, absSize, onSuccess]);

  const handleClose = useCallback(() => {
    if (isSubmitting) {
      return;
    }
    setError(null);
    onClose();
  }, [isSubmitting, onClose]);

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader
          onClose={handleClose}
          startAccessory={
            <Box
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                backgroundColor: 'var(--color-background-alternative)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon
                name={IconName.SwapHorizontal}
                size={IconSize.Sm}
                color={IconColor.IconDefault}
              />
            </Box>
          }
        >
          {t('perpsReversePosition')}
        </ModalHeader>

        <ModalBody style={{ width: '100%' }}>
          <Box
            flexDirection={BoxFlexDirection.Column}
            gap={4}
            style={{ width: '100%' }}
          >
            {/* Direction row */}
            <Box
              flexDirection={BoxFlexDirection.Row}
              justifyContent={BoxJustifyContent.Between}
              alignItems={BoxAlignItems.Center}
            >
              <Text
                variant={TextVariant.BodyMd}
                color={TextColor.TextAlternative}
              >
                {t('perpsDirection')}
              </Text>
              <Box
                flexDirection={BoxFlexDirection.Row}
                alignItems={BoxAlignItems.Center}
                gap={1}
              >
                <Text
                  variant={TextVariant.BodyMd}
                  fontWeight={FontWeight.Medium}
                >
                  {currentDirection}
                </Text>
                <Icon
                  name={IconName.ArrowRight}
                  size={IconSize.Xs}
                  color={IconColor.IconAlternative}
                />
                <Text
                  variant={TextVariant.BodyMd}
                  fontWeight={FontWeight.Medium}
                >
                  {newDirection}
                </Text>
              </Box>
            </Box>

            {/* Estimated size row */}
            <Box
              flexDirection={BoxFlexDirection.Row}
              justifyContent={BoxJustifyContent.Between}
              alignItems={BoxAlignItems.Center}
            >
              <Text
                variant={TextVariant.BodyMd}
                color={TextColor.TextAlternative}
              >
                {t('perpsReverseEstimatedSize')}
              </Text>
              <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
                {absSize} {displayName}
              </Text>
            </Box>

            {/* Fees row */}
            <Box
              flexDirection={BoxFlexDirection.Row}
              justifyContent={BoxJustifyContent.Between}
              alignItems={BoxAlignItems.Center}
            >
              <Text
                variant={TextVariant.BodyMd}
                color={TextColor.TextAlternative}
              >
                {t('perpsFees')}
              </Text>
              <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
                {estimatedFees}
              </Text>
            </Box>

            {/* Error message */}
            {error && (
              <Box
                className="bg-error-muted rounded-lg"
                padding={3}
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
                  {error}
                </Text>
              </Box>
            )}

            {/* Action buttons */}
            <Box
              flexDirection={BoxFlexDirection.Row}
              gap={3}
              style={{ width: '100%' }}
            >
              <Button
                variant={ButtonVariant.Secondary}
                size={ButtonSize.Lg}
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1"
                data-testid="reverse-position-cancel-button"
              >
                {t('cancel')}
              </Button>
              <Button
                variant={ButtonVariant.Primary}
                size={ButtonSize.Lg}
                onClick={handleReverse}
                disabled={isSubmitting}
                isLoading={isSubmitting}
                className="flex-1"
                data-testid="reverse-position-save-button"
              >
                {t('save')}
              </Button>
            </Box>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ReversePositionModal;
