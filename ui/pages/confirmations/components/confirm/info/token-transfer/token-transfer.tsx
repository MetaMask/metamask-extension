import {
  TransactionContainerType,
  TransactionMeta,
} from '@metamask/transaction-controller';
import React from 'react';
import { useConfirmContext } from '../../../../context/confirm';
import { SimulationDetails } from '../../../simulation-details';
import { TransactionPaySection } from '../../../rows/transaction-pay-section/transaction-pay-section';
import { AdvancedDetails } from '../shared/advanced-details/advanced-details';
import { GasFeesSection } from '../shared/gas-fees-section/gas-fees-section';
import SendHeading from '../shared/send-heading/send-heading';
import { EnforcedSimulationsRow } from '../../../rows/enforced-simulations-row';
import { TokenDetailsSection } from './token-details-section';
import { TransactionFlowSection } from './transaction-flow-section';

const TokenTransferInfo = () => {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const isWalletInitiated = transactionMeta.origin === 'metamask';
  const isEnforcedSimulationsEnabled = transactionMeta.containerTypes?.includes(
    TransactionContainerType.EnforcedSimulations,
  );

  return (
    <>
      <SendHeading />
      <TransactionFlowSection />
      <SimulationDetails
        transaction={transactionMeta}
        isTransactionsRedesign
        enableMetrics
        metricsOnly={isWalletInitiated}
        sectionMarginBottom={isEnforcedSimulationsEnabled ? 2 : undefined}
      />
      <EnforcedSimulationsRow />
      <TokenDetailsSection />
      <TransactionPaySection />
      <GasFeesSection />
      <AdvancedDetails />
    </>
  );
};

export default TokenTransferInfo;
