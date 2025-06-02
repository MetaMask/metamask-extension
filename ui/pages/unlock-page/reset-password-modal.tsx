import React from 'react';
import { useI18nContext } from '../../hooks/useI18nContext';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
} from '../../components/component-library';
import {
  AlignItems,
  BlockSize,
  Display,
  JustifyContent,
  TextVariant,
} from '../../helpers/constants/design-system';

export default function ResetPasswordModal({
  onClose,
  onRestore,
}: {
  onClose: () => void;
  onRestore: () => void;
}) {
  const t = useI18nContext();

  return (
    <Modal
      isOpen
      onClose={onClose}
      className="reset-password-modal"
      data-testid="reset-password-modal"
    >
      <ModalOverlay />
      <ModalContent alignItems={AlignItems.center}>
        <ModalHeader onClose={onClose}>
          {t('forgotPasswordModalTitle')}
        </ModalHeader>
        <Box paddingInline={4}>
          <Box
            width={BlockSize.Full}
            display={Display.Flex}
            justifyContent={JustifyContent.center}
            alignItems={AlignItems.center}
            marginBottom={2}
          >
            <img
              src="images/forgot-password-lock.png"
              width={154}
              height={154}
              alt={t('forgotPasswordModalTitle')}
              style={{
                alignSelf: 'center',
              }}
            />
          </Box>
          <Text variant={TextVariant.bodyMd} marginBottom={4}>
            {t('forgotPasswordModalDescription1')}
          </Text>
          <Text variant={TextVariant.bodyMd} marginBottom={6}>
            {t('forgotPasswordModalDescription2')}
          </Text>
          <Button
            data-testid="reset-password-modal-button"
            variant={ButtonVariant.Primary}
            onClick={onRestore}
            size={ButtonSize.Lg}
            block
            danger
          >
            {t('forgotPasswordModalButton')}
          </Button>
        </Box>
      </ModalContent>
    </Modal>
  );
}
