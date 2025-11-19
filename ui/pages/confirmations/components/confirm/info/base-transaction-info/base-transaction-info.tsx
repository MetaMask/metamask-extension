import { TransactionMeta } from '@metamask/transaction-controller';
import React from 'react';

import { useConfirmContext } from '../../../../context/confirm';
import { DappSwapComparisonBanner } from '../../dapp-swap-comparison-banner/dapp-swap-comparison-banner';
import { AdvancedDetails } from '../shared/advanced-details/advanced-details';
import { GasFeesSection } from '../shared/gas-fees-section/gas-fees-section';
import { TransactionDetails } from '../shared/transaction-details/transaction-details';
import { TransactionAccountDetails } from '../batch/transaction-account-details';
import { BatchSimulationDetails } from '../batch/batch-simulation-details/batch-simulation-details';
import { EstimatedPointsSection } from '../../../estimated-points';

const BaseTransactionInfo = () => {
  const { currentConfirmation: transactionMeta, isQuotedSwapDisplayedInInfo } =
    useConfirmContext<TransactionMeta>();

  if (!transactionMeta?.txParams) {
    return null;
  }

  return (
    <>
      <DappSwapComparisonBanner />
      {!isQuotedSwapDisplayedInInfo && (
        <>
          <TransactionAccountDetails />
          <BatchSimulationDetails />
          <TransactionDetails />
        </>
      )}
      <GasFeesSection />
      <AdvancedDetails />
      <EstimatedPointsSection />
    </>
  );
};

export default BaseTransactionInfo;
