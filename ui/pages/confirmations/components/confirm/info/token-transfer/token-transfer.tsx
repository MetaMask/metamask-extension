import { TransactionMeta } from '@metamask/transaction-controller';
import React from 'react';
import { ConfirmInfoSection } from '../../../../../../components/app/confirm/info/row/section';
import { useConfirmContext } from '../../../../context/confirm';
import { SimulationDetails } from '../../../simulation-details';
import { AdvancedDetails } from '../shared/advanced-details/advanced-details';
import { GasFeesSection } from '../shared/gas-fees-section/gas-fees-section';
import SendHeading from '../shared/send-heading/send-heading';
import { TokenDetailsSection } from './token-details-section';
import { TransactionFlowSection } from './transaction-flow-section';

const TokenTransferInfo = () => {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const isWalletInitiated = transactionMeta.origin === 'metamask';

  return (
    <>
      <SendHeading />
      <TransactionFlowSection />
      {!isWalletInitiated && (
        <ConfirmInfoSection noPadding>
          <SimulationDetails
            simulationData={transactionMeta.simulationData}
            transactionId={transactionMeta.id}
            isTransactionsRedesign
          />
        </ConfirmInfoSection>
      )}
      <TokenDetailsSection />
      <GasFeesSection />
      <AdvancedDetails />
    </>
  );
};

export default TokenTransferInfo;
