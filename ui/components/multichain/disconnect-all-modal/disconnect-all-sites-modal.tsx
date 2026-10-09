import React from 'react';
import {
  Button,
  ButtonSize,
  ButtonVariant,
  Text,
  TextVariant,
  TextColor,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalContent,
} from '@metamask/design-system-react';
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
        <ModalHeader
          onClose={onClose}
          closeButtonProps={{ ariaLabel: t('close') }}
        >
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
            isFullWidth
            variant={ButtonVariant.Primary}
            size={ButtonSize.Lg}
            isDanger
            data-testid="disconnect-all-sites-confirm"
          >
            {t('disconnectAllSites')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
