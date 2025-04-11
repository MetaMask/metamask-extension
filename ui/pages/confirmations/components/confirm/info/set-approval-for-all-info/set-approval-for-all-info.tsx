import type { TransactionMeta } from '@metamask/transaction-controller';
import React from 'react';

import { useConfirmContext } from '../../../../context/confirm';
import { ApproveDetails } from '../approve/approve-details/approve-details';
import { useTokenTransactionData } from '../hooks/useTokenTransactionData';
import { AdvancedDetails } from '../shared/advanced-details/advanced-details';
import { GasFeesSection } from '../shared/gas-fees-section/gas-fees-section';
import { getIsRevokeSetApprovalForAll } from '../utils';
import { RevokeSetApprovalForAllStaticSimulation } from './revoke-set-approval-for-all-static-simulation/revoke-set-approval-for-all-static-simulation';
import { SetApprovalForAllStaticSimulation } from './set-approval-for-all-static-simulation/set-approval-for-all-static-simulation';

const SetApprovalForAllInfo = () => {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const parsedTransactionData = useTokenTransactionData();

  const spender = parsedTransactionData?.args?._operator;

  const isRevokeSetApprovalForAll = getIsRevokeSetApprovalForAll(
    parsedTransactionData,
  );

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
      <AdvancedDetails />
    </>
  );
};

export default SetApprovalForAllInfo;
