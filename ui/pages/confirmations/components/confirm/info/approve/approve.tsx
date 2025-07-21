import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import React, { useState } from 'react';
import { useConfirmContext } from '../../../../context/confirm';
import { useAssetDetails } from '../../../../hooks/useAssetDetails';
import { AdvancedDetails } from '../shared/advanced-details/advanced-details';
import { ConfirmLoader } from '../shared/confirm-loader/confirm-loader';
import { GasFeesSection } from '../shared/gas-fees-section/gas-fees-section';
import { ApproveDetails } from './approve-details/approve-details';
import { ApproveStaticSimulation } from './approve-static-simulation/approve-static-simulation';
import { EditSpendingCapModal } from './edit-spending-cap-modal/edit-spending-cap-modal';
import { useApproveTokenSimulation } from './hooks/use-approve-token-simulation';
import { useIsNFT } from './hooks/use-is-nft';
import { RevokeDetails } from './revoke-details/revoke-details';
import { RevokeStaticSimulation } from './revoke-static-simulation/revoke-static-simulation';

const ApproveInfo = () => {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const { isNFT } = useIsNFT(transactionMeta);

  const [isOpenEditSpendingCapModal, setIsOpenEditSpendingCapModal] =
    useState(false);

  const { decimals } = useAssetDetails(
    transactionMeta.txParams.to,
    transactionMeta.txParams.from,
    transactionMeta.txParams.data,
    transactionMeta.chainId,
  );

  const { spendingCap, pending } = useApproveTokenSimulation(
    transactionMeta,
    decimals,
  );

  const showRevokeVariant =
    spendingCap === '0' &&
    transactionMeta.type === TransactionType.tokenMethodApprove;

  if (!transactionMeta?.txParams) {
    return null;
  }

  if (pending || (!isNFT && !decimals)) {
    return <ConfirmLoader />;
  }

  return (
    <>
      {showRevokeVariant ? (
        <RevokeStaticSimulation />
      ) : (
        <ApproveStaticSimulation
          setIsOpenEditSpendingCapModal={setIsOpenEditSpendingCapModal}
        />
      )}
      {showRevokeVariant ? <RevokeDetails /> : <ApproveDetails />}
      <GasFeesSection />
      <AdvancedDetails />
      <EditSpendingCapModal
        isOpenEditSpendingCapModal={isOpenEditSpendingCapModal}
        setIsOpenEditSpendingCapModal={setIsOpenEditSpendingCapModal}
      />
    </>
  );
};

export default ApproveInfo;
