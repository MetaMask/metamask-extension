import React from 'react';
import { useTransactionMetadataRequest } from '../../../../hooks/useTransactionMetadataRequest';
import { SimulationDetails } from '../../../simulation-details';
import { TransactionPaySection } from '../../../rows/transaction-pay-section/transaction-pay-section';
import { AdvancedDetails } from '../shared/advanced-details/advanced-details';
import { GasFeesSection } from '../shared/gas-fees-section/gas-fees-section';
import SendHeading from '../shared/send-heading/send-heading';
import { TokenDetailsSection } from './token-details-section';
import { TransactionFlowSection } from './transaction-flow-section';

const TokenTransferInfo = () => {
  const transactionMeta = useTransactionMetadataRequest();

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
      <TransactionPaySection />
      <GasFeesSection />
      <AdvancedDetails />
    </>
  );
};

export default TokenTransferInfo;
