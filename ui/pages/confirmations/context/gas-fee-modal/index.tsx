import React, {
  ReactElement,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { TransactionMeta } from '@metamask/transaction-controller';
import { GasModalType } from '../../constants/gas';
import { GasFeeModal } from '../../components/modals/gas-fee-modal/gas-fee-modal';
import { ConfirmContextProvider } from '../confirm';
import { EditGasModes } from '../../../../../shared/constants/gas';

export type GasFeeModalContextType = {
  isGasFeeModalVisible: boolean;
  initialModalType: GasModalType;
  openGasFeeModal: (modalType?: GasModalType) => void;
  closeGasFeeModal: () => void;
  /** When provided (e.g. from cancel-speedup), gas modals use this instead of useConfirmContext. */
  transactionMeta?: TransactionMeta;
  editGasMode?: EditGasModes;
};

export const GasFeeModalContext = createContext<
  GasFeeModalContextType | undefined
>(undefined);

export const GasFeeModalContextProvider: React.FC<{
  children: ReactElement;
  /** Optional transaction for gas editing when outside confirm flow (e.g. cancel/speedup). */
  transactionMeta?: TransactionMeta;
  editGasMode?: EditGasModes;
}> = ({ children, transactionMeta, editGasMode }) => {
  const [isGasFeeModalVisible, setIsGasFeeModalVisible] = useState(false);
  const [initialModalType, setInitialModalType] = useState<GasModalType>(
    GasModalType.EstimatesModal,
  );

  const openGasFeeModal = useCallback((modalType?: GasModalType) => {
    setInitialModalType(modalType ?? GasModalType.EstimatesModal);
    setIsGasFeeModalVisible(true);
  }, []);

  const closeGasFeeModal = useCallback(() => {
    setIsGasFeeModalVisible(false);
  }, []);

  const value = useMemo(
    () => ({
      isGasFeeModalVisible,
      initialModalType,
      openGasFeeModal,
      closeGasFeeModal,
      transactionMeta,
      editGasMode,
    }),
    [
      isGasFeeModalVisible,
      initialModalType,
      openGasFeeModal,
      closeGasFeeModal,
      transactionMeta,
      editGasMode,
    ],
  );

  return (
    <GasFeeModalContext.Provider value={value}>
      {children}
    </GasFeeModalContext.Provider>
  );
};

export const useGasFeeModalContext = () => {
  const context = useContext(GasFeeModalContext);
  if (!context) {
    throw new Error(
      'useGasFeeModalContext must be used within a GasFeeModalContextProvider',
    );
  }
  return context;
};

/**
 * Optional getter for GasFeeModalContext. Returns undefined when outside
 * GasFeeModalContextProvider (e.g. EditGasFeePopover on transaction list).
 * Used by components that support both legacy useGasFeeContext and the
 * GasFeeModalContextProvider flow (e.g. cancel-speedup).
 */
export const useGasFeeModalContextOptional = () =>
  useContext(GasFeeModalContext);

export const GasFeeModalWrapper = () => {
  const {
    isGasFeeModalVisible,
    initialModalType,
    closeGasFeeModal,
    transactionMeta,
  } = useGasFeeModalContext();

  if (!isGasFeeModalVisible) {
    return null;
  }

  const gasFeeModal = (
    <GasFeeModal
      setGasModalVisible={() => closeGasFeeModal()}
      initialModalType={initialModalType}
    />
  );

  // When opened from cancel-speedup, inject transactionMeta into ConfirmContext
  // so child modals (EstimatesModal, AdvancedEIP1559Modal, etc.) can use useConfirmContext().
  if (transactionMeta) {
    return (
      <ConfirmContextProvider currentConfirmationOverride={transactionMeta}>
        {gasFeeModal}
      </ConfirmContextProvider>
    );
  }

  return gasFeeModal;
};
