import React from 'react';
import {
  Text,
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
 * @param props - Component props
 * @param props.visible - Controls the visibility of the modal
 * @param props.onConfirm - Callback function triggered when user confirms
 * @param props.onClose - Callback function triggered when modal is closed
 * @returns A modal with hardware wallet confirmation instructions
 */
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
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
