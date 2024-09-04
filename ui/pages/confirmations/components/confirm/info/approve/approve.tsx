import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useConfirmContext } from '../../../../context/confirm';
import { selectConfirmationAdvancedDetailsOpen } from '../../../../selectors/preferences';
import { AdvancedDetails } from '../shared/advanced-details/advanced-details';
import { GasFeesSection } from '../shared/gas-fees-section/gas-fees-section';
import { ApproveDetails } from './approve-details/approve-details';
import { ApproveStaticSimulation } from './approve-static-simulation/approve-static-simulation';
import { EditSpendingCapModal } from './edit-spending-cap-modal/edit-spending-cap-modal';
import { useIsNFT } from './hooks/use-is-nft';
import { RevokeDetails } from './revoke-details/revoke-details';
import { RevokeStaticSimulation } from './revoke-static-simulation/revoke-static-simulation';
import { useSpendingCapContext } from './spending-cap-context';
import { SpendingCap } from './spending-cap/spending-cap';

const ApproveInfo = () => {
  const { currentConfirmation: transactionMeta } = useConfirmContext() as {
    currentConfirmation: TransactionMeta;
  };

  const showAdvancedDetails = useSelector(
    selectConfirmationAdvancedDetailsOpen,
  );

  const { isNFT } = useIsNFT(transactionMeta);

  const [isOpenEditSpendingCapModal, setIsOpenEditSpendingCapModal] =
    useState(false);

  if (!transactionMeta?.txParams) {
    return null;
  }

  const showRevokeScreen =
    customSpendingCap === '0' &&
    transactionMeta.type === TransactionType.tokenMethodApprove;

  return (
    <>
      {showRevokeScreen ? (
        <RevokeStaticSimulation />
      ) : (
        <ApproveStaticSimulation />
      )}
      {showRevokeScreen ? <RevokeDetails /> : <ApproveDetails />}
      {!isNFT && !showRevokeScreen && (
        <SpendingCap
          setIsOpenEditSpendingCapModal={setIsOpenEditSpendingCapModal}
        />
      )}
      <GasFeesSection />
      {showAdvancedDetails && <AdvancedDetails />}
      <EditSpendingCapModal
        isOpenEditSpendingCapModal={isOpenEditSpendingCapModal}
        setIsOpenEditSpendingCapModal={setIsOpenEditSpendingCapModal}
      />
    </>
  );
};

export default ApproveInfo;
