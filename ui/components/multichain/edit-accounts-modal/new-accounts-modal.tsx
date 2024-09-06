import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  Box,
} from '../../component-library';
import { CreateEthAccount } from '..';

type NewAccountModalProps = {
  onClose: () => void;
};

export const NewAccountModal: React.FC<NewAccountModalProps> = ({
  onClose,
}) => {
  return (
    <Modal
      isOpen
      onClose={onClose}
      data-testid="new-accounts-modal"
      className="new-accounts-modal"
    >
      <ModalOverlay />
      <ModalContent>
        <Box paddingLeft={4} paddingRight={4} paddingBottom={4}>
          <CreateEthAccount onActionComplete={onClose} />
        </Box>
      </ModalContent>
    </Modal>
  );
};
