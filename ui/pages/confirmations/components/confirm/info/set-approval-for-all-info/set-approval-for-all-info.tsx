import { TransactionMeta } from '@metamask/transaction-controller';
import React from 'react';
import { useSelector } from 'react-redux';
import { useConfirmContext } from '../../../../context/confirm';
import { selectConfirmationAdvancedDetailsOpen } from '../../../../selectors/preferences';
import { ApproveDetails } from '../approve/approve-details/approve-details';
import { useDecodedTransactionData } from '../hooks/useDecodedTransactionData';
import { AdvancedDetails } from '../shared/advanced-details/advanced-details';
import { GasFeesSection } from '../shared/gas-fees-section/gas-fees-section';
import { RevokeSetApprovalForAllStaticSimulation } from './revoke-set-approval-for-all-static-simulation/revoke-set-approval-for-all-static-simulation';
import { SetApprovalForAllStaticSimulation } from './set-approval-for-all-static-simulation/set-approval-for-all-static-simulation';

const SetApprovalForAllInfo = () => {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const showAdvancedDetails = useSelector(
    selectConfirmationAdvancedDetailsOpen,
  );

  const decodedResponse = useDecodedTransactionData();

  const { value } = decodedResponse;

  const isRevokeSetApprovalForAll =
    value?.data[0].name === 'setApprovalForAll' &&
    value?.data[0].params[1].value === false;

  const spender = value?.data[0].params[0].value;

  if (!transactionMeta?.txParams) {
    return null;
  }

  return (
    <>
      {isRevokeSetApprovalForAll ? (
        <RevokeSetApprovalForAllStaticSimulation spender={spender} />
      ) : (
        <SetApprovalForAllStaticSimulation />
      )}
      <ApproveDetails isSetApprovalForAll />
      <GasFeesSection />
      {showAdvancedDetails && <AdvancedDetails />}
    </>
  );
};

export default SetApprovalForAllInfo;
