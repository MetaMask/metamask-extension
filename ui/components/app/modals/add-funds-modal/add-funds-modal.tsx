import React from 'react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  Box,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from '../../../component-library';

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
        asChild
        data-testid={id}
        className="add-funds-modal__row flex items-center w-full gap-3 p-4"
        onClick={onClick}
      >
        <button>
          <Icon
            name={iconName}
            size={IconSize.Lg}
            color={IconColor.IconAlternative}
          />
          <Text variant={TextVariant.BodyMd}>{label}</Text>
        </button>
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
        <ModalHeader onClose={onClose}>{t('addFunds')}</ModalHeader>
        <ModalBody className="add-funds-modal__body">
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
