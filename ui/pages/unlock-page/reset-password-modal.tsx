import React from 'react';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../hooks/useI18nContext';
import {
  AvatarBase,
  AvatarBaseSize,
  Box,
  Button,
  ButtonLink,
  ButtonLinkSize,
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
  BackgroundColor,
  BlockSize,
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../helpers/constants/design-system';
import { isSocialLoginFlow } from '../../selectors';
import Divider from '../../components/app/divider';

export default function ResetPasswordModal({
  onClose,
  onRestore,
}: {
  onClose: () => void;
  onRestore: () => void;
}) {
  const t = useI18nContext();

  const isSocialLoginEnabled = useSelector(isSocialLoginFlow);

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
        >
          <Box display={Display.Flex} gap={4} as="li">
            <AvatarBase
              size={AvatarBaseSize.Sm}
              backgroundColor={BackgroundColor.infoMuted}
              color={TextColor.infoDefault}
            >
              1
            </AvatarBase>
            <Text variant={TextVariant.bodyMd}>
              {t('forgotPasswordSocialStep1', [
                <Text
                  variant={TextVariant.bodyMdBold}
                  key="reset-password-step-1-settings"
                >
                  {t('forgotPasswordSocialStep1Settings')}
                </Text>,
              ])}
            </Text>
          </Box>
          <Box display={Display.Flex} gap={4} as="li">
            <AvatarBase
              size={AvatarBaseSize.Sm}
              backgroundColor={BackgroundColor.infoMuted}
              color={TextColor.infoDefault}
            >
              2
            </AvatarBase>
            <Text variant={TextVariant.bodyMd}>
              {t('forgotPasswordSocialStep2')}
            </Text>
          </Box>
          <Box display={Display.Flex} gap={4} as="li">
            <AvatarBase
              size={AvatarBaseSize.Sm}
              backgroundColor={BackgroundColor.infoMuted}
              color={TextColor.infoDefault}
            >
              3
            </AvatarBase>
            <Text variant={TextVariant.bodyMd}>
              {t('forgotPasswordSocialStep3')}
            </Text>
          </Box>
        </Box>
        <Divider marginTop={2} marginBottom={4} />
        <Text>
          {t('forgotPasswordSocialSocialReset', [
            [
              <ButtonLink
                key="forgotPasswordSocialSocialReset"
                size={ButtonLinkSize.Inherit}
                onClick={() => {
                  onRestore();
                }}
              >
                {t('resetWallet')}
              </ButtonLink>,
            ],
          ])}
        </Text>
      </Box>
    );
  };

  const srpLoginContent = () => {
    return (
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
