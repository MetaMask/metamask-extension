import React from 'react';
import {
  FontWeight,
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
import {
  Button,
} from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getURLHost } from '../../../helpers/utils/util';

type DisconnectAllModalProps = {
  onClick: () => void;
  onClose: () => void;
  origin: string;
};

export const DisconnectAllModal = ({
  onClick,
  onClose,
  origin,
}: DisconnectAllModalProps) => {
  const t = useI18nContext();
  const host = getURLHost(origin);

  return (
    <Modal isOpen onClose={onClose} data-testid="disconnect-all-modal">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader
          className=""
          onClose={onClose}
          closeButtonProps={{ ariaLabel: t('close') }}
        >
          {t('disconnectQuestion')}
        </ModalHeader>
        <ModalBody>
          <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
            {t('disconnectSiteDescriptionText', [
              <Text
                key="siteHost"
                asChild
                variant={TextVariant.BodyMd}
                color={TextColor.TextAlternative}
                fontWeight={FontWeight.Bold}
              >
                <span>{host}</span>
              </Text>,
            ])}
          </Text>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClick} block data-testid="disconnect-all" danger>
            {t('disconnect')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
