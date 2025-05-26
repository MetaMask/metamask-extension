import React from 'react';
import { useI18nContext } from '../../hooks/useI18nContext';
import {
  AvatarBase,
  AvatarBaseSize,
  Box,
  ButtonLink,
  ButtonLinkSize,
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
} from '../../components/component-library';
import {
  BackgroundColor,
  Display,
  FlexDirection,
  TextColor,
  TextVariant,
} from '../../helpers/constants/design-system';
import Divider from '../../components/app/divider';

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
      <ModalContent>
        <ModalHeader onClose={onClose}>{t('resetPassword')}</ModalHeader>
        <Box paddingLeft={4} paddingRight={4}>
          <Text variant={TextVariant.bodyMd} marginBottom={4}>
            {t('resetPasswordDescription')}
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
                {t('resetPasswordStep1', [
                  <Text
                    variant={TextVariant.bodyMdBold}
                    key="reset-password-step-1-settings"
                  >
                    {t('resetPasswordStep1Settings')}
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
                {t('resetPasswordStep2')}
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
                {t('resetPasswordStep3')}
              </Text>
            </Box>
          </Box>
          <Divider
            marginTop={2}
            marginBottom={4}
          />
          <Text>
            {t('resetPasswordSocialReset', [
              [
                <ButtonLink
                  key="resetPasswordSocialReset"
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
      </ModalContent>
    </Modal>
  );
}
