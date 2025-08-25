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

export default function CancelMembershipModal({
  onConfirm,
  onClose,
}: {
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      isOpen
      onClose={onClose}
      className="change-password-warning-modal"
      data-testid="change-password-warning-modal"
    >
      <ModalOverlay />
      <ModalContent alignItems={AlignItems.flexStart}>
        <ModalHeader onClose={onClose}>Are you sure?</ModalHeader>
        <ModalBody>
          <Text variant={TextVariant.bodyMd}>
            If you cancel, your wallet and transactions will not be covered
            starting{' '}
            <Text variant={TextVariant.bodyMdMedium} as="span">
              Apr 18, 2024.
            </Text>
          </Text>
        </ModalBody>
        <ModalFooter
          onSubmit={onConfirm}
          submitButtonProps={{
            children: 'Cancel membership',
            danger: true,
          }}
        />
      </ModalContent>
    </Modal>
  );
}
