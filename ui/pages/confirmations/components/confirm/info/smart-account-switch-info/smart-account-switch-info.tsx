import { TransactionMeta } from '@metamask/transaction-controller';
import React from 'react';

import { useConfirmContext } from '../../../../context/confirm';
import { AdvancedDetails } from '../shared/advanced-details/advanced-details';
import { GasFeesSection } from '../shared/gas-fees-section/gas-fees-section';
import { TransactionAccountDetails } from '../batch/transaction-account-details';

const SmartAccountSwitchInfo = () => {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  if (!transactionMeta?.txParams) {
    return null;
  }

  return (
    <>
      <TransactionAccountDetails />
      <GasFeesSection />
      <AdvancedDetails />
    </>
  );
};

export default SmartAccountSwitchInfo;
