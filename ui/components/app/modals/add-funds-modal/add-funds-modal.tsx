import React from 'react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  Text,
  IconName,
  Icon,
  IconSize,
  Box,
} from '../../../component-library';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  Display,
  IconColor,
  JustifyContent,
  TextVariant,
} from '../../../../helpers/constants/design-system';

const AddFundsModal = ({ onClose }: { onClose: () => void }) => {
  const t = useI18nContext();

  const buttonRow = (
    label: string,
    iconName: IconName,
    onClick: () => void,
    id?: string,
  ) => {
    return (
      <Box
        as="button"
        data-testid={id}
        className="add-funds-modal__row"
        display={Display.Flex}
        alignItems={AlignItems.center}
        width={BlockSize.Full}
        padding={4}
        gap={3}
        onClick={onClick}
      >
        <Icon
          name={iconName}
          size={IconSize.Lg}
          color={IconColor.iconAlternativeSoft}
        />
        <Text variant={TextVariant.bodyMdMedium}>{label}</Text>
      </Box>
    );
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      data-testid="add-funds-modal"
      className="add-funds-modal"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{t('addFunds')}</ModalHeader>
        <ModalBody
          className="add-funds-modal__body"
        >
          {buttonRow(
            t('addFundsModalBuyCrypto'),
            IconName.Add,
            () => {},
            'add-funds-modal-buy-crypto-button',
          )}
          {buttonRow(
            t('addFundsModalSwapTokens'),
            IconName.SwapHorizontal,
            () => {},
            'add-funds-modal-swap-tokens-button',
          )}
          {buttonRow(
            t('addFundsModalReceiveTokens'),
            IconName.QrCode,
            () => {},
            'add-funds-modal-receive-crypto-button',
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default AddFundsModal;
