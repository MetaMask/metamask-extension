import React from 'react';
import { useUnapprovedTransactionWithFallback } from '../../../../hooks/transactions/useUnapprovedTransaction';
import { SimulationDetails } from '../../../simulation-details';
import { AdvancedDetails } from '../shared/advanced-details/advanced-details';
import { GasFeesSection } from '../shared/gas-fees-section/gas-fees-section';
import SendHeading from '../shared/send-heading/send-heading';
import { TokenDetailsSection } from './token-details-section';
import { TransactionFlowSection } from './transaction-flow-section';

const TokenTransferInfo = () => {
  const transactionMeta = useUnapprovedTransactionWithFallback();

  const isWalletInitiated = transactionMeta.origin === 'metamask';

  return (
    <>
      <SendHeading />
      <TransactionFlowSection />
      <SimulationDetails
        transaction={transactionMeta}
        isTransactionsRedesign
        enableMetrics
        metricsOnly={isWalletInitiated}
      />
      <TokenDetailsSection />
      <GasFeesSection />
      <AdvancedDetails />
    </>
  );
};

export default TokenTransferInfo;
