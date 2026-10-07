import React from 'react';
import {
  ButtonVariant,
  Text,
  TextVariant,
  TextColor,
} from '@metamask/design-system-react';
import { Modal } from '../../../components/component-library/modal/modal';
import { ModalOverlay } from '../../../components/component-library/modal-overlay/modal-overlay';
import { ModalContent } from '../../../components/component-library/modal-content/modal-content';
import { ModalContentSize } from '../../../components/component-library/modal-content/modal-content.types';
import { ModalHeader } from '../../../components/component-library/modal-header/modal-header';
import { ModalBody } from '../../../components/component-library/modal-body/modal-body';
import { ModalFooter } from '../../../components/component-library/modal-footer/modal-footer';
import type { ButtonProps } from '../../../components/component-library/button/button.types';
import { useI18nContext } from '../../../hooks/useI18nContext';

export type DeleteContactModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
};

export function DeleteContactModal({
  isOpen,
  onClose,
  onConfirm,
}: DeleteContactModalProps) {
  const t = useI18nContext();

  return (
    <Modal isOpen={isOpen} onClose={onClose} data-testid="delete-contact-modal">
      <ModalOverlay />
      <ModalContent size={ModalContentSize.Sm}>
        <ModalHeader onClose={onClose}>{t('areYouSure')}</ModalHeader>
        <ModalBody>
          <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
            {t('thisContactWillBeDeleted')}
          </Text>
        </ModalBody>
        <ModalFooter
          onSubmit={onConfirm}
          submitButtonProps={{
            children: t('delete'),
            variant:
              ButtonVariant.Secondary as unknown as ButtonProps<'button'>['variant'],
            danger: true,
            'data-testid': 'delete-contact-confirm-button',
          }}
        />
      </ModalContent>
    </Modal>
  );
}
