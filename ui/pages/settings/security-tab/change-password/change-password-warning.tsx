import React from 'react';

import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  Display,
  IconColor,
  JustifyContent,
  TextAlign,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import {
  Box,
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  ButtonSize,
  Button,
  Icon,
  IconSize,
  IconName,
  ButtonVariant,
} from '../../../../components/component-library';

export default function ChangePasswordWarning({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const t = useI18nContext();

  return (
    <Modal
      isOpen
      onClose={onCancel}
      className="change-password-warning-modal"
      data-testid="change-password-warning-modal"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Box>
            <Box display={Display.Flex} justifyContent={JustifyContent.center}>
              <Icon
                name={IconName.Danger}
                size={IconSize.Xl}
                color={IconColor.warningDefault}
              />
            </Box>
            <Text
              variant={TextVariant.headingMd}
              textAlign={TextAlign.Center}
              marginTop={4}
            >
              {t('changePasswordWarning')}
            </Text>
            <Text variant={TextVariant.bodySm} marginTop={4}>
              {t('changePasswordWarningDescription')}
            </Text>
          </Box>
        </ModalHeader>
        <Box paddingLeft={4} paddingRight={4}>
          <Box display={Display.Flex} marginTop={2} gap={4}>
            <Button
              variant={ButtonVariant.Secondary}
              data-testid="change-password-warning-cancel"
              size={ButtonSize.Lg}
              block
              onClick={() => onCancel()}
            >
              {t('cancel')}
            </Button>
            <Button
              data-testid="change-password-warning-confirm"
              size={ButtonSize.Lg}
              block
              onClick={() => onConfirm()}
            >
              {t('confirm')}
            </Button>
          </Box>
        </Box>
      </ModalContent>
    </Modal>
  );
}
