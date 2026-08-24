import React, { createContext, useContext } from 'react';

const TransactionDetailsContractContext = createContext<string | undefined>(
  undefined,
);

export function useTransactionDetailsContract() {
  return useContext(TransactionDetailsContractContext);
}

export function TransactionDetailsContractProvider({
  children,
  contractAddress,
}: {
  children: React.ReactNode;
  contractAddress?: string;
}) {
  return (
    <TransactionDetailsContractContext.Provider value={contractAddress}>
      {children}
    </TransactionDetailsContractContext.Provider>
  );
}
