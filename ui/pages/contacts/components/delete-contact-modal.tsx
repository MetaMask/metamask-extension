import React from 'react';
import {
  ButtonVariant,
  Text,
  TextVariant,
  TextColor,
} from '@metamask/design-system-react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalContentSize,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '../../../components/component-library';
import type { ButtonProps } from '../../../components/component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';

export interface DeleteContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}

export function DeleteContactModal({
  isOpen,
  onClose,
  onConfirm,
}: DeleteContactModalProps) {
  const t = useI18nContext();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      data-testid="delete-contact-modal"
    >
      <ModalOverlay />
      <ModalContent size={ModalContentSize.Sm}>
        <ModalHeader onClose={onClose}>
          {t('areYouSure')}
        </ModalHeader>
        <ModalBody>
          <Text
            variant={TextVariant.BodyMd}
            color={TextColor.TextAlternative}
          >
            {t('thisContactWillBeDeleted')}
          </Text>
        </ModalBody>
        <ModalFooter
          onSubmit={onConfirm}
          submitButtonProps={{
            children: t('delete'),
            variant: ButtonVariant.Secondary as unknown as ButtonProps<'button'>['variant'],
            danger: true,
            'data-testid': 'delete-contact-confirm-button',
          }}
        />
      </ModalContent>
    </Modal>
  );
}
