import React from 'react';
import { Text, TextVariant, TextColor } from '@metamask/design-system-react';
import {
  Button,
  ButtonSize,
  ButtonVariant,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';

export type DisconnectAllSitesModalProps = {
  isOpen: boolean;
  onClick: () => void;
  onClose: () => void;
};

export const DisconnectAllSitesModal = ({
  isOpen,
  onClick,
  onClose,
}: DisconnectAllSitesModalProps) => {
  const t = useI18nContext();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      data-testid="disconnect-all-sites-modal"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onClose}>
          {t('disconnectAllSitesQuestion')}
        </ModalHeader>
        <ModalBody>
          <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
            {t('disconnectAllSitesDescriptionText')}
          </Text>
        </ModalBody>
        <ModalFooter>
          <Button
            onClick={onClick}
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
