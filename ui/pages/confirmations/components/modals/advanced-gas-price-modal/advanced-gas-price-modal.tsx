import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
} from '../../../../../components/component-library';
import { GasModalType } from '../../../constants/gas';

export const AdvancedGasPriceModal = ({
  setActiveModal,
  handleCloseModals,
}: {
  setActiveModal: (modal: GasModalType) => void;
  handleCloseModals: () => void;
}) => {
  return (
    <Modal isOpen={true} onClose={handleCloseModals}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Advanced Gas Price</ModalHeader>
      </ModalContent>
    </Modal>
  );
};
