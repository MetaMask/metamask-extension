import React from 'react';
import {
  Button,
  IconName,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';

// Maps to localizations for title and text
export enum DisconnectType {
  Account = 'disconnectAllAccountsText',
  Snap = 'disconnectAllSnapsText',
}

export const DisconnectAllModal = ({
  type,
  hostname,
  onClick,
  onClose,
}: {
  type: DisconnectType;
  hostname: string;
  onClick: () => void;
  onClose: () => void;
}) => {
  const t = useI18nContext();

  return (
    <Modal isOpen onClose={onClose} data-testid="disconnect-all-modal">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onClose}>
          {process.env.CHAIN_PERMISSION
            ? t('disconnect')
            : t('disconnectAllTitle', [t(type)])}
        </ModalHeader>
        <ModalBody>
          {process.env.CHAIN_PERMISSION ? (
            <Text>{t('disconnectAllDescription', [hostname])}</Text>
          ) : (
            <Text>{t('disconnectAllText', [t(type), hostname])}</Text>
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            onClick={onClick}
            startIconName={IconName.Logout}
            block
            danger
            data-testid="disconnect-all"
          >
            {t('disconnect')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
