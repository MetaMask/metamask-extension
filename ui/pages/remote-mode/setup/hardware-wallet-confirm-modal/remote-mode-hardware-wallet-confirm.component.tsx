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

/**
 * A modal component that displays confirmation modal for remote mode setup.
 *
 * @param {Object} props - Component props
 * @param {boolean} props.visible - Controls the visibility of the modal
 * @param {Function} props.onConfirm - Callback function triggered when user confirms
 * @param {Function} props.onClose - Callback function triggered when modal is closed
 * @returns {JSX.Element} A modal with hardware wallet confirmation instructions
 */
export default function RemoteModeHardwareWalletConfirm({
  visible,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {

  return (
    <Modal onClose={onClose} isOpen={visible}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onClose}>Confirm</ModalHeader>
        <ModalBody>
          <Text paddingBottom={4}>
            Ready to confirm on your hardware wallet?
          </Text>
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
