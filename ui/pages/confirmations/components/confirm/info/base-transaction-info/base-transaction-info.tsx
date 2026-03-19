import React from 'react';

import { TransactionPaySection } from '../../../rows/transaction-pay-section/transaction-pay-section';
import { useTransactionMetadataRequest } from '../../../../hooks/useTransactionMetadataRequest';
import { useDappSwapContext } from '../../../../context/dapp-swap';
import { DappSwapComparisonBanner } from '../../dapp-swap-comparison-banner/dapp-swap-comparison-banner';
import { AdvancedDetails } from '../shared/advanced-details/advanced-details';
import { GasFeesSection } from '../shared/gas-fees-section/gas-fees-section';
import { TransactionDetails } from '../shared/transaction-details/transaction-details';
import { TransactionAccountDetails } from '../batch/transaction-account-details';
import { BatchSimulationDetails } from '../batch/batch-simulation-details/batch-simulation-details';
import { EstimatedPointsSection } from '../../../estimated-points';

const BaseTransactionInfo = () => {
  const transactionMeta = useTransactionMetadataRequest();
  const { isQuotedSwapDisplayedInInfo } = useDappSwapContext();

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
      <TransactionPaySection />
      <GasFeesSection />
      <AdvancedDetails />
      <EstimatedPointsSection />
    </>
  );
};

export default BaseTransactionInfo;
