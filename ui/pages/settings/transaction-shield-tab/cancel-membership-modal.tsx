import React from 'react';
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from '../../../components/component-library';
import {
  AlignItems,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';

export default function CancelMembershipModal({
  onConfirm,
  onClose,
}: {
  onConfirm: () => void;
  onClose: () => void;
}) {
  const t = useI18nContext();

  return (
    <Modal
      isOpen
      onClose={onClose}
      className="cancel-membership-modal"
      data-testid="cancel-membership-modal"
    >
      <ModalOverlay />
      <ModalContent alignItems={AlignItems.flexStart}>
        <ModalHeader onClose={onClose}>{t('areYouSure')}</ModalHeader>
        <ModalBody>
          <Text variant={TextVariant.bodyMd}>
            {t('shieldTxCancelDetails', [
              <Text
                key="cancel-date"
                variant={TextVariant.bodyMdMedium}
                as="span"
              >
                Apr 18, 2024
              </Text>,
            ])}
          </Text>
        </ModalBody>
        <ModalFooter
          onSubmit={onConfirm}
          submitButtonProps={{
            'data-testid': 'cancel-membership-modal-submit-button',
            children: t('shieldTxMembershipCancel'),
            danger: true,
          }}
        />
      </ModalContent>
    </Modal>
  );
}
