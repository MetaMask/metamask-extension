import PropTypes from 'prop-types';
import React from 'react';
import { useI18nContext } from '../../hooks/useI18nContext';
import {
  AvatarBase,
  AvatarBaseSize,
  Box,
  ButtonBase,
  ButtonBaseSize,
  IconName,
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
} from '../../components/component-library';
import {
  BackgroundColor,
  BorderRadius,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../helpers/constants/design-system';

export default function ResetPasswordModal({
  onClose,
  onEraseWallet,
}: {
  onClose: () => void;
  onEraseWallet: () => void;
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
        <ModalHeader onClose={onClose}>
          <Text variant={TextVariant.headingMd} textAlign={TextAlign.Center}>
            {t('resetPassword')}
          </Text>
        </ModalHeader>
        <Box paddingLeft={4} paddingRight={4}>
          <Text variant={TextVariant.bodyMd} marginBottom={6}>
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
                    variant={TextVariant.bodyMdMedium}
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
          <Box display={Display.Flex} marginTop={6}>
            <ButtonBase
              size={ButtonBaseSize.Lg}
              startIconName={IconName.Trash}
              startIconProps={{
                color: IconColor.errorDefault,
                marginRight: 2,
              }}
              block
              borderRadius={BorderRadius.LG}
              justifyContent={JustifyContent.flexStart}
              onClick={() => onEraseWallet()}
            >
              <Text
                variant={TextVariant.bodyMd}
                color={TextColor.errorDefault}
                textAlign={TextAlign.Left}
              >
                {t('resetPasswordAnotherOption')}
              </Text>
            </ButtonBase>
          </Box>
        </Box>
      </ModalContent>
    </Modal>
  );
}

ResetPasswordModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onEraseWallet: PropTypes.func.isRequired,
};
