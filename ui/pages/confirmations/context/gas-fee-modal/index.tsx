import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  Suspense,
} from 'react';
import { TransactionMeta } from '@metamask/transaction-controller';
import { GasModalType } from '../../constants/gas';
import { mmLazy } from '../../../../helpers/utils/mm-lazy';
import { ConfirmContextProvider } from '../confirm';
import { EditGasModes } from '../../../../../shared/constants/gas';

const GasFeeModal = mmLazy(
  () => import('../../components/modals/gas-fee-modal/gas-fee-modal'),
);

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

export const GasFeeModalContextProvider = ({
  children,
  transactionMeta,
  editGasMode,
}: React.PropsWithChildren<{
  children: React.ReactNode;
  /** Optional transaction for gas editing when outside confirm flow (e.g. cancel/speedup). */
  transactionMeta?: TransactionMeta;
  editGasMode?: EditGasModes;
}>) => {
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
    <Suspense fallback={null}>
      <GasFeeModal
        setGasModalVisible={() => closeGasFeeModal()}
        initialModalType={initialModalType}
      />
    </Suspense>
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
