import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useConfirmContext } from '../../../../context/confirm';
import { useAssetDetails } from '../../../../hooks/useAssetDetails';
import { selectConfirmationAdvancedDetailsOpen } from '../../../../selectors/preferences';
import { AdvancedDetails } from '../shared/advanced-details/advanced-details';
import { GasFeesSection } from '../shared/gas-fees-section/gas-fees-section';
import { ApproveDetails } from './approve-details/approve-details';
import { ApproveStaticSimulation } from './approve-static-simulation/approve-static-simulation';
import { EditSpendingCapModal } from './edit-spending-cap-modal/edit-spending-cap-modal';
import { useApproveTokenSimulation } from './hooks/use-approve-token-simulation';
import { useIsNFT } from './hooks/use-is-nft';
import { RevokeDetails } from './revoke-details/revoke-details';
import { RevokeStaticSimulation } from './revoke-static-simulation/revoke-static-simulation';
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

  const { decimals } = useAssetDetails(
    transactionMeta.txParams.to,
    transactionMeta.txParams.from,
    transactionMeta.txParams.data,
  );

  const { spendingCap } = useApproveTokenSimulation(
    transactionMeta,
    decimals || '0',
  );

  const showRevokeVariant =
    spendingCap === '0' &&
    transactionMeta.type === TransactionType.tokenMethodApprove;

  if (!transactionMeta?.txParams) {
    return null;
  }

  return (
    <>
      {showRevokeVariant ? (
        <RevokeStaticSimulation />
      ) : (
        <ApproveStaticSimulation />
      )}
      {showRevokeVariant ? <RevokeDetails /> : <ApproveDetails />}
      {!isNFT && !showRevokeVariant && (
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
