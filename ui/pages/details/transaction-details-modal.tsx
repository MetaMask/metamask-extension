import React from 'react';
import {
  Modal,
  ModalContent,
  ModalContentSize,
  ModalOverlay,
} from '@metamask/design-system-react';
import { TransactionDetails } from './transaction-details';

export function TransactionDetailsModal({
  isOpen,
  chainId,
  txIdentifier,
  onClose,
}: {
  isOpen: boolean;
  chainId: string | undefined;
  txIdentifier: string | undefined;
  onClose: () => void;
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isClosedOnOutsideClick={false}
      className="transaction-details-modal"
    >
      <ModalOverlay />
      <ModalContent
        className="p-0 sm:p-0 md:p-0"
        size={ModalContentSize.Lg}
        modalDialogProps={{
          className:
            'h-full max-w-[clamp(var(--width-sm),85vw,var(--width-max))] rounded-none shadow-none p-0',
        }}
      >
        <TransactionDetails
          chainId={chainId}
          txIdentifier={txIdentifier}
          onBack={onClose}
        />
      </ModalContent>
    </Modal>
  );
}
