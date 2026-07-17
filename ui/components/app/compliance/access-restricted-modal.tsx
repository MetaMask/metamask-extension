import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  Button,
  ButtonSize,
  ButtonVariant,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalContentSize,
  ModalHeader,
  ModalOverlay,
} from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';

export type AccessRestrictedModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onContactSupport: () => void;
};

export const AccessRestrictedModal = ({
  isOpen,
  onClose,
  onContactSupport,
}: AccessRestrictedModalProps) => {
  const t = useI18nContext();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      data-testid="access-restricted-modal"
    >
      <ModalOverlay />
      <ModalContent size={ModalContentSize.Sm}>
        <ModalHeader onClose={onClose}>
          {t('accessRestrictedTitle')}
        </ModalHeader>
        <ModalBody>
          <Box
            flexDirection={BoxFlexDirection.Column}
            alignItems={BoxAlignItems.Center}
            gap={4}
          >
            <Box flexDirection={BoxFlexDirection.Column} gap={3}>
              <Text
                variant={TextVariant.BodyMd}
                color={TextColor.TextAlternative}
              >
                {t('accessRestrictedDescriptionLine1')}
              </Text>
              <Text
                variant={TextVariant.BodyMd}
                color={TextColor.TextAlternative}
              >
                {t('accessRestrictedDescriptionLine2')}
              </Text>
            </Box>
            <Button
              variant={ButtonVariant.Primary}
              size={ButtonSize.Lg}
              isFullWidth
              onClick={onContactSupport}
              data-testid="access-restricted-contact-support"
            >
              {t('accessRestrictedContactSupport')}
            </Button>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
