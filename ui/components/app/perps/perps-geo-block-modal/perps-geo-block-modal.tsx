import React from 'react';
import {
  Box,
  BoxFlexDirection,
  BoxAlignItems,
  Text,
  TextVariant,
  TextColor,
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
} from '../../../component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';

export type PerpsGeoBlockModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

/**
 * Modal shown to geo-blocked users when they attempt a restricted Perps action
 * (trade, deposit, modify, close, TP/SL, etc.). Matches the mobile
 * PerpsBottomSheetTooltip with contentKey="geo_block".
 *
 * @param options0 - Component props
 * @param options0.isOpen - Whether the modal is visible
 * @param options0.onClose - Callback to dismiss the modal
 */
export const PerpsGeoBlockModal: React.FC<PerpsGeoBlockModalProps> = ({
  isOpen,
  onClose,
}) => {
  const t = useI18nContext();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      data-testid="perps-geo-block-modal"
    >
      <ModalOverlay />
      <ModalContent size={ModalContentSize.Sm}>
        <ModalHeader onClose={onClose}>{t('perpsGeoBlockedTitle')}</ModalHeader>
        <ModalBody>
          <Box
            flexDirection={BoxFlexDirection.Column}
            alignItems={BoxAlignItems.Center}
            gap={4}
          >
            <Text
              variant={TextVariant.BodyMd}
              color={TextColor.TextAlternative}
            >
              {t('perpsGeoBlockedDescription')}
            </Text>
            <Button
              variant={ButtonVariant.Primary}
              size={ButtonSize.Lg}
              isFullWidth
              onClick={onClose}
              data-testid="perps-geo-block-modal-dismiss"
            >
              {t('gotIt')}
            </Button>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
