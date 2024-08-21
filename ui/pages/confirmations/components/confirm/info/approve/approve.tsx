import { TransactionMeta } from '@metamask/transaction-controller';
import React from 'react';
import { useSelector } from 'react-redux';
import { currentConfirmationSelector } from '../../../../../../selectors';
import { selectConfirmationAdvancedDetailsOpen } from '../../../../selectors/preferences';
import { AdvancedDetails } from '../shared/advanced-details/advanced-details';
import { GasFeesSection } from '../shared/gas-fees-section/gas-fees-section';
import { ApproveDetails } from './approve-details/approve-details';

const ApproveInfo = () => {
  const transactionMeta = useSelector(
    currentConfirmationSelector,
  ) as TransactionMeta;

  const showAdvancedDetails = useSelector(
    selectConfirmationAdvancedDetailsOpen,
  );

  if (!transactionMeta?.txParams) {
    return null;
  }

  return (
    <>
      <ApproveDetails />
      <GasFeesSection />
      {showAdvancedDetails && <AdvancedDetails />}
    </>
  );
};

export default ApproveInfo;
