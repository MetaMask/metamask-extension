import React, { createContext, useContext, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import type { EditGasModes } from '../../../../shared/constants/gas';
import { TransactionModalContextProvider } from '../../../contexts/transaction-modal';
import { CancelSpeedup } from '../../../pages/confirmations/cancel-speedup/cancel-speedup';
import type { MetaMaskReduxState } from '../../../store/store';
import { selectTransactionById } from '../../../selectors/transactionController';

export type PendingTransactionGasModalProps = {
  setEditGasMode: (mode: EditGasModes) => void;
  onGasModalMetaId: (metaId: string) => void;
};

const PendingTransactionGasModalContext =
  createContext<PendingTransactionGasModalProps | null>(null);

export function usePendingTransactionGasModal(): PendingTransactionGasModalProps {
  const context = useContext(PendingTransactionGasModalContext);

  if (!context) {
    throw new Error(
      'usePendingTransactionGasModal must be used within PendingTransactionCancelSpeedUpProvider',
    );
  }

  return context;
}

type PendingTransactionCancelSpeedUpProviderProps = {
  children: React.ReactNode;
};

/**
 * Single cancel/speed-up modal for activity list.
 * @param options0
 * @param options0.children
 */
export const PendingTransactionCancelSpeedUpProvider = ({
  children,
}: Readonly<PendingTransactionCancelSpeedUpProviderProps>) => {
  const [editGasMode, setEditGasMode] = useState<EditGasModes>();
  const [gasModalMetaId, setGasModalMetaId] = useState<string>();
  const gasModalMeta = useSelector((state: MetaMaskReduxState) =>
    selectTransactionById(state, gasModalMetaId),
  );
  const gasModalProps = useMemo(
    () => ({
      setEditGasMode,
      onGasModalMetaId: setGasModalMetaId,
    }),
    [],
  );

  return (
    <TransactionModalContextProvider>
      <PendingTransactionGasModalContext.Provider value={gasModalProps}>
        {children}
        {gasModalMeta && editGasMode !== undefined ? (
          <CancelSpeedup transaction={gasModalMeta} editGasMode={editGasMode} />
        ) : null}
      </PendingTransactionGasModalContext.Provider>
    </TransactionModalContextProvider>
  );
};
