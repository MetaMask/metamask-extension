import { TransactionMeta } from '@metamask/transaction-controller';
import React from 'react';
import { ConfirmInfoSection } from '../../../../../../components/app/confirm/info/row/section';
import { useConfirmContext } from '../../../../context/confirm';
import { SimulationDetails } from '../../../simulation-details';
import { AdvancedDetails } from '../shared/advanced-details/advanced-details';
import { GasFeesSection } from '../shared/gas-fees-section/gas-fees-section';
import NFTSendHeading from '../shared/nft-send-heading/nft-send-heading';
import { TokenDetailsSection } from '../token-transfer/token-details-section';
import { TransactionFlowSection } from '../token-transfer/transaction-flow-section';

const NFTTokenTransferInfo = () => {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const isWalletInitiated = transactionMeta.origin === 'metamask';

  return (
    <>
      <NFTSendHeading />
      <TransactionFlowSection />
      {!isWalletInitiated && (
        <ConfirmInfoSection noPadding>
          <SimulationDetails
            transaction={transactionMeta}
            isTransactionsRedesign
            enableMetrics
          />
        </ConfirmInfoSection>
      )}
      <TokenDetailsSection />
      <GasFeesSection />
      <AdvancedDetails />
    </>
  );
};

export default NFTTokenTransferInfo;
