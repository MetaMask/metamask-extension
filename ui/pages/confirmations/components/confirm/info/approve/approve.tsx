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
import { getCustomTxParamsData } from '../../../../confirm-approve/confirm-approve.util';
import { useAssetDetails } from '../../../../hooks/useAssetDetails';

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

  const { decimals } = useAssetDetails(
    transactionMeta.txParams?.to,
    transactionMeta.txParams?.from,
    transactionMeta.txParams?.data,
  );

  const setCustomSpendingCap = (newValue: string) => {
    // coerce negative numbers to zero
    if (parseInt(newValue, 10) < 0) {
      newValue = '0';
    }

    const customTxParamsData = getCustomTxParamsData(
      transactionMeta.txParams.data,
      {
        customPermissionAmount: newValue,
        decimals,
      },
    );

    transactionMeta.txParams.data = customTxParamsData;

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
        />
      )}
      <GasFeesSection />
      {showAdvancedDetails && <AdvancedDetails />}
      <EditSpendingCapModal
        isOpenEditSpendingCapModal={isOpenEditSpendingCapModal}
        setIsOpenEditSpendingCapModal={setIsOpenEditSpendingCapModal}
        setCustomSpendingCap={setCustomSpendingCap}
      />
    </>
  );
};

export default ApproveInfo;
