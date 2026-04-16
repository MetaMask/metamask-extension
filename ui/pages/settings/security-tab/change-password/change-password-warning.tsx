import React from 'react';
import {
  Box,
  Text,
  ButtonSize,
  Button,
  Icon,
  IconSize,
  IconName,
  ButtonVariant,
  BoxJustifyContent,
  IconColor,
  TextVariant,
  TextAlign,
  BoxAlignItems,
  BoxFlexDirection,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { AlignItems } from '../../../../helpers/constants/design-system';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from '../../../../components/component-library';
import ZENDESK_URLS from '../../../../helpers/constants/zendesk-url';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function ChangePasswordWarning({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const t = useI18nContext();

  const changePasswordLearnMore = (
    <a
      key="change-password__link-text"
      href={ZENDESK_URLS.PASSWORD_RESET}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span className="change-password__link-text">
        {t('learnMoreUpperCase')}
      </span>
    </a>
  );

  return (
    <Modal
      isOpen
      onClose={onCancel}
      className="change-password-warning-modal"
      data-testid="change-password-warning-modal"
    >
      <ModalOverlay />
      <ModalContent alignItems={AlignItems.center}>
        <ModalHeader>
          <Box>
            <Box
              flexDirection={BoxFlexDirection.Row}
              justifyContent={BoxJustifyContent.Center}
              alignItems={BoxAlignItems.Center}
            >
              <Icon
                name={IconName.Danger}
                size={IconSize.Xl}
                color={IconColor.WarningDefault}
              />
            </Box>
            <Text
              variant={TextVariant.HeadingMd}
              textAlign={TextAlign.Center}
              className="mt-4"
            >
              {t('changePasswordWarning')}
            </Text>
            <Text variant={TextVariant.BodySm} className="mt-4">
              {t('changePasswordWarningDescription')} {changePasswordLearnMore}
            </Text>
          </Box>
        </ModalHeader>
        <Box paddingLeft={4} paddingRight={4}>
          <Box flexDirection={BoxFlexDirection.Row} marginTop={2} gap={4}>
            <Button
              variant={ButtonVariant.Secondary}
              data-testid="change-password-warning-cancel"
              size={ButtonSize.Lg}
              className="w-full"
              onClick={() => onCancel()}
            >
              {t('cancel')}
            </Button>
            <Button
              data-testid="change-password-warning-confirm"
              size={ButtonSize.Lg}
              className="w-full"
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
