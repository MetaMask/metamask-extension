import React, { useCallback, useState } from 'react';

import { EstimatesModal } from '../estimates-modal/estimates-modal';
import { AdvancedEIP1559Modal } from '../advanced-eip1559-modal/advanced-eip1559-modal';
import { AdvancedGasPriceModal } from '../advanced-gas-price-modal/advanced-gas-price-modal';
import { GasModalType } from '../../../constants/gas';

export const GasFeeModal = ({
  setGasModalVisible,
  initialModalType = GasModalType.EstimatesModal,
}: {
  setGasModalVisible: (visible: boolean) => void;
  initialModalType?: GasModalType;
}) => {
  const [activeModal, setActiveModal] = useState(initialModalType);

  const handleCloseModals = useCallback(() => {
    setGasModalVisible(false);
  }, [setGasModalVisible]);

  switch (activeModal) {
    case GasModalType.EstimatesModal:
      return (
        <EstimatesModal
          setActiveModal={setActiveModal}
          handleCloseModals={handleCloseModals}
        />
      );
    case GasModalType.AdvancedEIP1559Modal:
      return (
        <AdvancedEIP1559Modal
          setActiveModal={setActiveModal}
          handleCloseModals={handleCloseModals}
        />
      );
    case GasModalType.AdvancedGasPriceModal:
      return (
        <AdvancedGasPriceModal
          setActiveModal={setActiveModal}
          handleCloseModals={handleCloseModals}
        />
      );
    default:
      return null;
  }
};
