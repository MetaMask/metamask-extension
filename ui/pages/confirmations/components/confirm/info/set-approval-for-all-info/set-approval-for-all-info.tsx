import { TransactionMeta } from '@metamask/transaction-controller';
import React from 'react';
import { useSelector } from 'react-redux';
import { useConfirmContext } from '../../../../context/confirm';
import { selectConfirmationAdvancedDetailsOpen } from '../../../../selectors/preferences';
import { ApproveDetails } from '../approve/approve-details/approve-details';
import { AdvancedDetails } from '../shared/advanced-details/advanced-details';
import { GasFeesSection } from '../shared/gas-fees-section/gas-fees-section';
import { SetApprovalForAllStaticSimulation } from './set-approval-for-all-static-simulation/set-approval-for-all-static-simulation';

const SetApprovalForAllInfo = () => {
  const { currentConfirmation: transactionMeta } = useConfirmContext() as {
    currentConfirmation: TransactionMeta;
  };

  const showAdvancedDetails = useSelector(
    selectConfirmationAdvancedDetailsOpen,
  );

  if (!transactionMeta?.txParams) {
    return null;
  }

  return (
    <>
      <SetApprovalForAllStaticSimulation />
      <ApproveDetails isSetApprovalForAll />
      <GasFeesSection />
      {showAdvancedDetails && <AdvancedDetails />}
    </>
  );
};

export default SetApprovalForAllInfo;
