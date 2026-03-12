import React from 'react';
import {
  Button,
  ButtonSize,
  ButtonVariant,
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

export type DisconnectAllSitesModalProps = {
  isOpen: boolean;
  onClick: () => void;
  onClose: () => void;
};

export const DisconnectAllSitesModal: React.FC<
  DisconnectAllSitesModalProps
> = ({ isOpen, onClick, onClose }) => {
  const t = useI18nContext();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      data-testid="disconnect-all-sites-modal"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onClose}>{t('disconnectAllSites')}</ModalHeader>
        <ModalBody>
          <Text>{t('disconnectAllSitesDescriptionText')}</Text>
        </ModalBody>
        <ModalFooter>
          <Button
            onClick={onClick}
            startIconName={IconName.Logout}
            block
            variant={ButtonVariant.Primary}
            size={ButtonSize.Lg}
            danger
            data-testid="disconnect-all-sites-confirm"
          >
            {t('disconnectAllSites')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
