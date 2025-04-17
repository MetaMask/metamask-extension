import { TransactionMeta } from '@metamask/transaction-controller';
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import React from 'react';
import { useConfirmContext } from '../../../../context/confirm';
import { SimulationDetails } from '../../../simulation-details';
import { AdvancedDetails } from '../shared/advanced-details/advanced-details';
import { GasFeesSection } from '../shared/gas-fees-section/gas-fees-section';
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
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

export default NFTTokenTransferInfo;
