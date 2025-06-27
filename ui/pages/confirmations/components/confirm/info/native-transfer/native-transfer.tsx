import React from 'react';
import { TransactionMeta } from '@metamask/transaction-controller';
import { useConfirmContext } from '../../../../context/confirm';
import { SimulationDetails } from '../../../simulation-details';
import { AdvancedDetails } from '../shared/advanced-details/advanced-details';
import { GasFeesSection } from '../shared/gas-fees-section/gas-fees-section';
import NativeSendHeading from '../shared/native-send-heading/native-send-heading';
import { TokenDetailsSection } from '../token-transfer/token-details-section';
import { TransactionFlowSection } from '../token-transfer/transaction-flow-section';
import { useMaxValueRefresher } from '../hooks/useMaxValueRefresher';
import { IntentsRow } from '../../../transactions/intents-row/intents-row';

const NativeTransferInfo = () => {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();
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
      <IntentsRow />
      <GasFeesSection />
      <AdvancedDetails />
    </>
  );
};

export default NativeTransferInfo;
