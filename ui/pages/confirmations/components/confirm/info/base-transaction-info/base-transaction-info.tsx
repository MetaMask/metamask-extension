import { TransactionMeta } from '@metamask/transaction-controller';
import React from 'react';
import { useSelector } from 'react-redux';

import { getRemoteFeatureFlags } from '../../../../../../selectors/remote-feature-flags';
import { useConfirmContext } from '../../../../context/confirm';
import { DappSwapComparisonBanner } from '../../dapp-swap-comparison-banner/dapp-swap-comparison-banner';
import { AdvancedDetails } from '../shared/advanced-details/advanced-details';
import { GasFeesSection } from '../shared/gas-fees-section/gas-fees-section';
import { TransactionDetails } from '../shared/transaction-details/transaction-details';
import { TransactionAccountDetails } from '../batch/transaction-account-details';
import { BatchSimulationDetails } from '../batch/batch-simulation-details/batch-simulation-details';

const DAPP_SWAP_COMPARISON_ORIGIN = 'https://app.uniswap.org';

const BaseTransactionInfo = () => {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();
  const { dappSwapMetrics } = useSelector(getRemoteFeatureFlags);

  if (!transactionMeta?.txParams) {
    return null;
  }

  const dappSwapMetricsEnabled =
    (dappSwapMetrics as { enabled: boolean })?.enabled === true &&
    transactionMeta.origin === DAPP_SWAP_COMPARISON_ORIGIN;

  return (
    <>
      {dappSwapMetricsEnabled && <DappSwapComparisonBanner />}
      <TransactionAccountDetails />
      <BatchSimulationDetails />
      <TransactionDetails />
      <GasFeesSection />
      <AdvancedDetails />
    </>
  );
};

export default BaseTransactionInfo;
