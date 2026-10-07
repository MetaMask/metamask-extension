import React from 'react';
import {
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
import { Button } from '../../component-library/button/button';
import {
  ButtonSize,
  ButtonVariant,
} from '../../component-library/button/button.types';
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
