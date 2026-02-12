import React, {
  ReactElement,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { GasModalType } from '../../constants/gas';
import { GasFeeModal } from '../../components/modals/gas-fee-modal/gas-fee-modal';

export type GasFeeModalContextType = {
  isGasFeeModalVisible: boolean;
  initialModalType: GasModalType;
  openGasFeeModal: (modalType?: GasModalType) => void;
  closeGasFeeModal: () => void;
};

export const GasFeeModalContext = createContext<
  GasFeeModalContextType | undefined
>(undefined);

export const GasFeeModalContextProvider: React.FC<{
  children: ReactElement;
}> = ({ children }) => {
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
    }),
    [isGasFeeModalVisible, initialModalType, openGasFeeModal, closeGasFeeModal],
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
  const { isGasFeeModalVisible, initialModalType, closeGasFeeModal } =
    useGasFeeModalContext();

  if (!isGasFeeModalVisible) {
    return null;
  }

  return (
    <GasFeeModal
      setGasModalVisible={() => closeGasFeeModal()}
      initialModalType={initialModalType}
    />
  );
};
