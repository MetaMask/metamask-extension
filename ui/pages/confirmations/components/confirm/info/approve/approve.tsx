import { TransactionMeta } from '@metamask/transaction-controller';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateCurrentConfirmation } from '../../../../../../ducks/confirm/confirm';
import { useConfirmContext } from '../../../../context/confirm';
import { selectConfirmationAdvancedDetailsOpen } from '../../../../selectors/preferences';
import { AdvancedDetails } from '../shared/advanced-details/advanced-details';
import { GasFeesSection } from '../shared/gas-fees-section/gas-fees-section';
import { ApproveDetails } from './approve-details/approve-details';
import { ApproveStaticSimulation } from './approve-static-simulation/approve-static-simulation';
import { EditSpendingCapModal } from './edit-spending-cap-modal/edit-spending-cap-modal';
import { useIsNFT } from './hooks/use-is-nft';
import { SpendingCap } from './spending-cap/spending-cap';

const ApproveInfo = () => {
  const dispatch = useDispatch();

  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const showAdvancedDetails = useSelector(
    selectConfirmationAdvancedDetailsOpen,
  );

  const { isNFT } = useIsNFT(transactionMeta);

  const [isOpenEditSpendingCapModal, setIsOpenEditSpendingCapModal] =
    useState(false);
  const [customSpendingCap, _setCustomSpendingCap] = useState('');

  const setCustomSpendingCap = (newValue: string) => {
    if (newValue === '') {
      delete transactionMeta.customTokenAmount;
      delete transactionMeta.finalApprovalAmount;
    } else {
      transactionMeta.customTokenAmount = newValue;
      transactionMeta.finalApprovalAmount = newValue;
    }

    _setCustomSpendingCap(newValue);
    dispatch(updateCurrentConfirmation(transactionMeta));
  };

  if (!transactionMeta?.txParams) {
    return null;
  }

  return (
    <>
      <ApproveStaticSimulation />
      <ApproveDetails />
      {!isNFT && (
        <SpendingCap
          setIsOpenEditSpendingCapModal={setIsOpenEditSpendingCapModal}
          customSpendingCap={customSpendingCap}
        />
      )}
      <GasFeesSection />
      {showAdvancedDetails && <AdvancedDetails />}
      <EditSpendingCapModal
        isOpenEditSpendingCapModal={isOpenEditSpendingCapModal}
        setIsOpenEditSpendingCapModal={setIsOpenEditSpendingCapModal}
        customSpendingCap={customSpendingCap}
        setCustomSpendingCap={setCustomSpendingCap}
      />
    </>
  );
};

export default ApproveInfo;
