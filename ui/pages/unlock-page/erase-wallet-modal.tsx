import PropTypes from 'prop-types';
import React from 'react';
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
  Display,
  IconColor,
  TextAlign,
  TextVariant,
} from '../../helpers/constants/design-system';

export default function EraseWalletModal({
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
      className="erase-wallet-modal"
      data-testid="erase-wallet-modal"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onClose}>
          <Box textAlign={TextAlign.Center}>
            <Icon
              name={IconName.Danger}
              size={IconSize.Xl}
              className="erase-wallet-modal__icon"
              color={IconColor.errorDefault}
            />
            <Text
              variant={TextVariant.headingMd}
              textAlign={TextAlign.Center}
              marginTop={4}
            >
              {t('eraseWalletTitle')}
            </Text>
          </Box>
        </ModalHeader>
        <Box paddingLeft={4} paddingRight={4}>
          <Text variant={TextVariant.bodyMd} marginBottom={6}>
            {t('eraseWalletDescription')}
          </Text>
          <Text variant={TextVariant.bodyMd}>
            {t('eraseWalletDescription2')}
          </Text>
          <Box display={Display.Flex} marginTop={6} gap={4}>
            <Button
              variant={ButtonVariant.Secondary}
              size={ButtonSize.Lg}
              onClick={() => onClose()}
              block
            >
              {t('cancel')}
            </Button>
            <Button
              size={ButtonSize.Lg}
              onClick={async () => onEraseWallet()}
              block
              danger
            >
              {t('eraseWalletButton')}
            </Button>
          </Box>
        </Box>
      </ModalContent>
    </Modal>
  );
}

EraseWalletModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onEraseWallet: PropTypes.func.isRequired,
};
