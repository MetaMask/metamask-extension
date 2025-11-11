import React from 'react';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../hooks/useI18nContext';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  Icon,
  IconName,
  IconSize,
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
} from '../../components/component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  FontWeight,
  IconColor,
  TextVariant,
  TextColor,
} from '../../helpers/constants/design-system';
import { getIsSocialLoginFlow } from '../../selectors';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function ResetPasswordModal({
  onClose,
  onRestore,
}: {
  onClose: () => void;
  onRestore: () => void;
}) {
  const t = useI18nContext();

  const isSocialLoginEnabled = useSelector(getIsSocialLoginFlow);

  const socialLoginContent = () => {
    return (
      <Box paddingInline={4}>
        <Text variant={TextVariant.bodyMd} marginBottom={4}>
          {t('forgotPasswordSocialDescription')}
        </Text>
        <Box
          as="ul"
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          gap={4}
          marginBottom={6}
        >
          <Box display={Display.Flex} gap={4} as="li">
            <Icon
              name={IconName.FaceId}
              size={IconSize.Md}
              color={IconColor.iconMuted}
              style={{
                marginTop: '2px',
              }}
            />
            <Text variant={TextVariant.bodyMd}>
              {t('forgotPasswordSocialStep1', [
                <Text
                  variant={TextVariant.inherit}
                  fontWeight={FontWeight.Bold}
                  key="reset-password-step-1-biometrics"
                >
                  {t('forgotPasswordSocialStep1Biometrics')}
                </Text>,
              ])}
            </Text>
          </Box>
          <Box display={Display.Flex} gap={4} as="li">
            <Icon
              name={IconName.SecurityKey}
              size={IconSize.Md}
              color={IconColor.iconMuted}
              style={{
                marginTop: '2px',
              }}
            />
            <Text variant={TextVariant.bodyMd}>
              {t('forgotPasswordSocialStep2', [
                <Text
                  variant={TextVariant.inherit}
                  fontWeight={FontWeight.Bold}
                  key="reset-password-step-2-srp"
                >
                  {t('secretRecoveryPhrase')}
                </Text>,
              ])}
            </Text>
          </Box>
        </Box>
        <Button
          data-testid="reset-password-modal-button"
          variant={ButtonVariant.Primary}
          onClick={onRestore}
          size={ButtonSize.Lg}
          block
        >
          {t('forgotPasswordModalButton')}
        </Button>
        <Button
          data-testid="reset-password-modal-button-link"
          variant={ButtonVariant.Link}
          onClick={onRestore}
          size={ButtonSize.Lg}
          block
          color={TextColor.primaryDefault}
        >
          {t('forgotPasswordModalButtonLink')}
        </Button>
      </Box>
    );
  };

  const srpLoginContent = () => {
    return (
      <Box paddingInline={4}>
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
        >
          {t('forgotPasswordModalButton')}
        </Button>
        <Button
          data-testid="reset-password-modal-button-link"
          variant={ButtonVariant.Link}
          onClick={onRestore}
          size={ButtonSize.Lg}
          block
          color={TextColor.primaryDefault}
        >
          {t('forgotPasswordModalButtonLink')}
        </Button>
      </Box>
    );
  };

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
        {isSocialLoginEnabled ? socialLoginContent() : srpLoginContent()}
      </ModalContent>
    </Modal>
  );
}
