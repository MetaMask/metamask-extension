import React from 'react';
import {
  Modal,
  ModalContent,
  ModalContentSize,
  ModalOverlay,
} from '../../components/component-library';
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
        size={ModalContentSize.Lg}
        style={{
          alignItems: 'center',
          height: '100vh',
          justifyContent: 'flex-start',
          padding: 0,
        }}
        modalDialogProps={{
          className: 'overflow-y-auto rounded-none shadow-none p-0',
          style: {
            height: '100vh',
            marginInline: 'auto',
            maxHeight: '100vh',
            width: 'clamp(320px, 100vw, var(--width-sm))',
          },
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
