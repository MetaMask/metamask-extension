import React, { useMemo, useCallback } from 'react';
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
} from '@metamask/design-system-react';
import {
  formatPerpsFiat,
  formatPnl,
  PRICE_RANGES_UNIVERSAL,
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
import { useI18nContext } from '../../../../hooks/useI18nContext';
import type { Position } from '../types';

export type CloseAllPositionsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  positions: Position[];
  isSubmitting: boolean;
};

export const CloseAllPositionsModal: React.FC<CloseAllPositionsModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  positions,
  isSubmitting,
}) => {
  const t = useI18nContext();

  const formatFiat = useCallback(
    (value: number | string) =>
      formatPerpsFiat(value, { ranges: PRICE_RANGES_UNIVERSAL }),
    [],
  );

  const totalMargin = useMemo(
    () =>
      positions.reduce(
        (sum, pos) => sum + (Number.parseFloat(pos.marginUsed) || 0),
        0,
      ),
    [positions],
  );

  const totalUnrealizedPnl = useMemo(
    () =>
      positions.reduce(
        (sum, pos) => sum + (Number.parseFloat(pos.unrealizedPnl) || 0),
        0,
      ),
    [positions],
  );

  const roundedMargin = useMemo(
    () => Math.round(totalMargin * 100) / 100,
    [totalMargin],
  );

  // HyperLiquid's marginUsed already includes accumulated PnL, so we do NOT
  // add unrealizedPnl separately (that would double-count).
  const youWillReceive = useMemo(
    () => Math.max(roundedMargin, 0),
    [roundedMargin],
  );

  const isSubmitDisabled = isSubmitting || positions.length === 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      data-testid="perps-close-all-positions-modal"
    >
      <ModalOverlay />
      <ModalContent size={ModalContentSize.Sm}>
        <ModalHeader onClose={onClose}>
          <Text
            variant={TextVariant.HeadingSm}
            fontWeight={FontWeight.Bold}
            textAlign={TextAlign.Center}
          >
            {t('perpsCloseAllPositions')}
          </Text>
        </ModalHeader>
        <ModalBody>
          <Box flexDirection={BoxFlexDirection.Column} gap={4}>
            <Text
              variant={TextVariant.BodySm}
              color={TextColor.TextDefault}
            >
              {t('perpsCloseAllDescription')}
            </Text>

            {/* Summary rows */}
            <Box flexDirection={BoxFlexDirection.Column}>
              {/* Margin */}
              <Box
                flexDirection={BoxFlexDirection.Row}
                justifyContent={BoxJustifyContent.Between}
                alignItems={BoxAlignItems.Start}
                paddingTop={1}
                paddingBottom={1}
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
                    textAlign={TextAlign.Right}
                    data-testid="perps-close-all-total-margin-value"
                  >
                    {formatFiat(roundedMargin)}
                  </Text>
                  <Text
                    variant={TextVariant.BodyXs}
                    color={TextColor.TextAlternative}
                    textAlign={TextAlign.Right}
                  >
                    {t('perpsIncludesPnl', [
                      <Text
                        key="perps-close-all-pnl"
                        variant={TextVariant.BodyXs}
                        color={
                          totalUnrealizedPnl >= 0
                            ? TextColor.SuccessDefault
                            : TextColor.ErrorDefault
                        }
                        asChild
                      >
                        <span>{formatPnl(totalUnrealizedPnl)}</span>
                      </Text>,
                    ])}
                  </Text>
                </Box>
              </Box>

              {/* Fees — divider line below (matches Figma border-bottom) */}
              <Box
                flexDirection={BoxFlexDirection.Row}
                justifyContent={BoxJustifyContent.Between}
                alignItems={BoxAlignItems.Center}
                paddingTop={1}
                paddingBottom={3}
                className="border-b border-border-muted"
              >
                <Text
                  variant={TextVariant.BodySm}
                  color={TextColor.TextAlternative}
                >
                  {t('perpsFees')}
                </Text>
                <Text
                  variant={TextVariant.BodySm}
                  data-testid="perps-close-all-fees-value"
                >
                  {formatFiat(0)}
                </Text>
              </Box>

              {/* You'll receive */}
              <Box
                flexDirection={BoxFlexDirection.Row}
                justifyContent={BoxJustifyContent.Between}
                alignItems={BoxAlignItems.Center}
                paddingTop={3}
                paddingBottom={1}
              >
                <Text
                  variant={TextVariant.BodySm}
                  color={TextColor.TextAlternative}
                >
                  {t('perpsYouWillReceive')}
                </Text>
                <Text
                  variant={TextVariant.BodySm}
                  data-testid="perps-close-all-receive-value"
                >
                  {formatFiat(Math.max(youWillReceive, 0))}
                </Text>
              </Box>
            </Box>
          </Box>
        </ModalBody>
        <ModalFooter
          onCancel={onClose}
          cancelButtonProps={{
            'data-testid': 'perps-close-all-positions-modal-cancel',
            children: t('perpsKeepPositions'),
          }}
          onSubmit={onConfirm}
          submitButtonProps={{
            'data-testid': 'perps-close-all-positions-modal-submit',
            children: t('perpsCloseAll'),
            disabled: isSubmitDisabled,
          }}
        />
      </ModalContent>
    </Modal>
  );
};
