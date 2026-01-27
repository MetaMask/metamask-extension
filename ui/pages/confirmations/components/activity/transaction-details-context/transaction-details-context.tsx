import React, { createContext, useContext, useMemo } from 'react';
import type { TransactionMeta } from '@metamask/transaction-controller';

type TransactionDetailsContextValue = {
  transactionMeta: TransactionMeta;
};

const TransactionDetailsContext = createContext<
  TransactionDetailsContextValue | undefined
>(undefined);

export function useTransactionDetails(): TransactionDetailsContextValue {
  const context = useContext(TransactionDetailsContext);
  if (!context) {
    throw new Error(
      'useTransactionDetails must be used within a TransactionDetailsProvider',
    );
  }
  return context;
}

type TransactionDetailsProviderProps = {
  children: React.ReactNode;
  transactionMeta: TransactionMeta;
};

// eslint-disable-next-line @typescript-eslint/naming-convention
export function TransactionDetailsProvider({
  children,
  transactionMeta,
}: TransactionDetailsProviderProps) {
  const value = useMemo(() => ({ transactionMeta }), [transactionMeta]);

  return (
    <TransactionDetailsContext.Provider value={value}>
      {children}
    </TransactionDetailsContext.Provider>
  );
}
