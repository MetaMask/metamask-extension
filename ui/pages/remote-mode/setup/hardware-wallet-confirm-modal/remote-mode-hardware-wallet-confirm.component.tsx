import React from 'react';
import {
  Text,
} from '../../../../components/component-library';

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '../../../../components/component-library';
export default function RemoteModeHardwareWalletConfirm({
  visible,
  onConfirm,
  onBack,
  onClose,
}: {
  visible: boolean;
  onConfirm: () => void;
  onBack: () => void;
  onClose: () => void;
}) {

  return (
    <Modal onClose={onClose} isOpen={visible}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onClose}>Confirm</ModalHeader>
        <ModalBody>
          <Text paddingBottom={4}>Ready to confirm on your hardware wallet?</Text>
          <Text paddingBottom={4}>Prior to clicking confirm:</Text>
          <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
            <Text as="li">
              Be sure your Ledger is plugged in and to select the Ethereum app.
            </Text>
            <Text as="li">
              Enable "smart contract data" or "blind signing" on your Ledger
              device.
            </Text>
          </ul>
        </ModalBody>
        <ModalFooter onCancel={onClose} onSubmit={onConfirm} />
      </ModalContent>
    </Modal>
  );
}
