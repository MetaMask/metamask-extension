import React from 'react';

import { useTransactionMetadataRequest } from '../../../../hooks/useTransactionMetadataRequest';
import { SimulationDetails } from '../../../simulation-details';
import { TransactionPaySection } from '../../../rows/transaction-pay-section/transaction-pay-section';
import { AdvancedDetails } from '../shared/advanced-details/advanced-details';
import { GasFeesSection } from '../shared/gas-fees-section/gas-fees-section';
import NativeSendHeading from '../shared/native-send-heading/native-send-heading';
import { TokenDetailsSection } from '../token-transfer/token-details-section';
import { TransactionFlowSection } from '../token-transfer/transaction-flow-section';
import { useMaxValueRefresher } from '../hooks/useMaxValueRefresher';

const NativeTransferInfo = () => {
  const transactionMeta = useTransactionMetadataRequest();
  useMaxValueRefresher();

  const isWalletInitiated = transactionMeta.origin === 'metamask';

  return (
    <>
      <NativeSendHeading />
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

export default NativeTransferInfo;
