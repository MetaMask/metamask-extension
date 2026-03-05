import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
  Text,
  TextVariant,
  TextColor,
  TextAlign,
  FontWeight,
  Icon,
  IconName,
  IconSize,
  IconColor,
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
import { useFormatters } from '../../../../hooks/useFormatters';
import { getPerpsController } from '../../../../providers/perps';
import { getPositionDirection, getDisplayName } from '../utils';
import { CloseAmountSection } from '../order-entry';
import type { Position, AccountState } from '../types';

export type ClosePositionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  position: Position;
  account: AccountState | null;
  currentPrice: number;
  selectedAddress: string;
};

/**
 * Modal for closing a position (partial or full).
 * Shows amount input, slider, margin/P&L summary, fees, and receive estimate.
 */
export const ClosePositionModal: React.FC<ClosePositionModalProps> = ({
  isOpen,
  onClose,
  position,
  account,
  currentPrice,
  selectedAddress,
}) => {
  const t = useI18nContext();
  const { formatCurrencyWithMinThreshold, formatTokenQuantity } =
    useFormatters();

  const [closePercent, setClosePercent] = useState(100);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const direction = getPositionDirection(position.size);
  const displayName = getDisplayName(position.symbol);

  const positionSize = useMemo(
    () => Math.abs(parseFloat(position.size)) || 0,
    [position.size],
  );

  const closeSize = useMemo(
    () => (positionSize * closePercent) / 100,
    [positionSize, closePercent],
  );

  const margin = useMemo(() => {
    const totalMargin = parseFloat(position.marginUsed) || 0;
    return (totalMargin * closePercent) / 100;
  }, [position.marginUsed, closePercent]);

  const unrealizedPnl = useMemo(() => {
    const pnl = parseFloat(position.unrealizedPnl) || 0;
    return (pnl * closePercent) / 100;
  }, [position.unrealizedPnl, closePercent]);

  const estimatedFees = useMemo(() => {
    const feeRate = 0.0001;
    return closeSize * currentPrice * feeRate;
  }, [closeSize, currentPrice]);

  const youWillReceive = useMemo(
    () => margin + unrealizedPnl - estimatedFees,
    [margin, unrealizedPnl, estimatedFees],
  );

  const isSubmitDisabled = closePercent <= 0 || isSubmitting || closeSize <= 0;

  const handleClose = useCallback(async () => {
    if (isSubmitDisabled || !selectedAddress) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const controller = await getPerpsController(selectedAddress);
      const params: {
        symbol: string;
        orderType: 'market';
        size?: string;
      } = {
        symbol: position.symbol,
        orderType: 'market',
      };

      if (closePercent < 100) {
        params.size = closeSize.toString();
      }

      const result = await controller.closePosition(params);
      if (!result.success) {
        throw new Error(result.error || 'Failed to close position');
      }
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred',
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isSubmitDisabled,
    selectedAddress,
    position.symbol,
    closePercent,
    closeSize,
    onClose,
  ]);

  const handlePercentChange = useCallback((percent: number) => {
    setClosePercent(percent);
    setError(null);
  }, []);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      data-testid="perps-close-position-modal"
    >
      <ModalOverlay />
      <ModalContent size={ModalContentSize.Sm}>
        <ModalHeader onClose={onClose}>{t('perpsClosePosition')}</ModalHeader>
        <ModalBody>
          <Box flexDirection={BoxFlexDirection.Column} gap={4}>
            {/* Available to close */}
            <Box
              flexDirection={BoxFlexDirection.Row}
              justifyContent={BoxJustifyContent.Between}
              alignItems={BoxAlignItems.Center}
            >
              <Text
                variant={TextVariant.BodySm}
                color={TextColor.TextAlternative}
              >
                {t('perpsAvailableToClose')}
              </Text>
              <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
                {formatTokenQuantity(positionSize, displayName)}
              </Text>
            </Box>

            {/* Close Amount Section (input + slider) */}
            <CloseAmountSection
              positionSize={position.size}
              closePercent={closePercent}
              onClosePercentChange={handlePercentChange}
              asset={displayName}
              currentPrice={currentPrice}
            />

            {/* Summary rows */}
            <Box flexDirection={BoxFlexDirection.Column} gap={2}>
              {/* Margin */}
              <Box
                flexDirection={BoxFlexDirection.Row}
                justifyContent={BoxJustifyContent.Between}
                alignItems={BoxAlignItems.Start}
              >
                <Text
                  variant={TextVariant.BodySm}
                  color={TextColor.TextAlternative}
                >
                  {t('perpsMargin')}
                </Text>
                <Box
                  flexDirection={BoxFlexDirection.Column}
                  alignItems={BoxAlignItems.End}
                >
                  <Text
                    variant={TextVariant.BodySm}
                    fontWeight={FontWeight.Medium}
                    textAlign={TextAlign.Right}
                  >
                    {formatCurrencyWithMinThreshold(margin, 'USD')}
                  </Text>
                  <Text
                    variant={TextVariant.BodyXs}
                    color={TextColor.TextAlternative}
                    textAlign={TextAlign.Right}
                  >
                    {t('perpsIncludesPnl', [
                      formatCurrencyWithMinThreshold(
                        Math.abs(unrealizedPnl),
                        'USD',
                      ),
                    ])}
                  </Text>
                </Box>
              </Box>

              {/* Fees */}
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
                >
                  -{formatCurrencyWithMinThreshold(estimatedFees, 'USD')}
                </Text>
              </Box>

              {/* You'll receive */}
              <Box
                flexDirection={BoxFlexDirection.Row}
                justifyContent={BoxJustifyContent.Between}
                alignItems={BoxAlignItems.Center}
              >
                <Text
                  variant={TextVariant.BodySm}
                  color={TextColor.TextAlternative}
                >
                  {t('perpsYouWillReceive')}
                </Text>
                <Text
                  variant={TextVariant.BodySm}
                  fontWeight={FontWeight.Medium}
                >
                  {formatCurrencyWithMinThreshold(
                    Math.max(youWillReceive, 0),
                    'USD',
                  )}
                </Text>
              </Box>
            </Box>

            {/* Error */}
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
          </Box>
        </ModalBody>
        <ModalFooter
          onCancel={onClose}
          onSubmit={handleClose}
          cancelButtonProps={{
            'data-testid': 'perps-close-position-modal-cancel',
            children: t('cancel'),
          }}
          submitButtonProps={{
            'data-testid': 'perps-close-position-modal-submit',
            children: t('perpsClosePosition'),
            disabled: isSubmitDisabled,
          }}
        />
      </ModalContent>
    </Modal>
  );
};
