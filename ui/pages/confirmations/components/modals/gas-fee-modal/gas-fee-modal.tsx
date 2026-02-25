import React, { useCallback, useState } from 'react';
import { TransactionMeta } from '@metamask/transaction-controller';
import { EstimatesModal } from '../estimates-modal/estimates-modal';
import { AdvancedEIP1559Modal } from '../advanced-eip1559-modal/advanced-eip1559-modal';
import { AdvancedGasPriceModal } from '../advanced-gas-price-modal/advanced-gas-price-modal';
import { GasModalType } from '../../../constants/gas';
import type { EditGasModes } from '../../../../../../shared/constants/gas';

export const GasFeeModal = ({
  setGasModalVisible,
  initialModalType = GasModalType.EstimatesModal,
  transactionMeta,
  editGasMode,
}: {
  setGasModalVisible: (visible: boolean) => void;
  initialModalType?: GasModalType;
  /** When provided (e.g. from cancel-speedup), GasFeeModalWrapper injects it into ConfirmContext for child modals. */
  transactionMeta?: TransactionMeta;
  editGasMode?: EditGasModes;
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
