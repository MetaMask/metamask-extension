import React from 'react';
import {
  AlignItems,
  IconColor,
  TextAlign,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  Box,
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  ButtonSize,
  Button,
  ButtonVariant,
  Icon,
  IconSize,
  IconName,
} from '../../../components/component-library';

type ConfirmSrpModalProps = {
  onContinue: () => void;
  onClose: () => void;
  isError: boolean;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function ConfirmSrpModal({
  onContinue,
  onClose,
  isError,
}: ConfirmSrpModalProps) {
  const t = useI18nContext();

  const handleContinue = () => {
    if (isError) {
      onClose();
    } else {
      onContinue();
    }
  };

  return (
    <Modal
      isOpen
      onClose={() => null}
      className="confirm-srp-modal"
      data-testid="confirm-srp-modal"
    >
      <ModalOverlay />
      <ModalContent alignItems={AlignItems.center}>
        <ModalHeader>
          <Box textAlign={TextAlign.Center}>
            <Icon
              name={isError ? IconName.CircleX : IconName.Confirmation}
              size={IconSize.Xl}
              className="skip-srp-backup-popover__icon"
              color={
                isError ? IconColor.errorDefault : IconColor.successDefault
              }
            />
            <Text
              variant={TextVariant.headingMd}
              textAlign={TextAlign.Center}
              marginTop={2}
              as="h2"
            >
              {isError
                ? t('confirmSrpErrorTitle')
                : t('confirmSrpSuccessTitle')}
            </Text>
          </Box>
        </ModalHeader>
        <Box paddingLeft={4} paddingRight={4}>
          <Text variant={TextVariant.bodyMd}>
            {isError
              ? t('confirmSrpErrorDescription')
              : t('confirmSrpSuccessDescription')}
          </Text>
          <Box marginTop={6}>
            <Button
              data-testid="confirm-srp-modal-button"
              variant={ButtonVariant.Primary}
              size={ButtonSize.Lg}
              onClick={handleContinue}
              block
            >
              {isError ? t('tryAgain') : t('gotIt')}
            </Button>
          </Box>
        </Box>
      </ModalContent>
    </Modal>
  );
}
