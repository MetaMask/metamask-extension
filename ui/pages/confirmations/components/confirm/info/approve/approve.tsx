import { TransactionMeta } from '@metamask/transaction-controller';
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { hexToDecimal } from '../../../../../../../shared/modules/conversion.utils';
import { updateCurrentConfirmation } from '../../../../../../ducks/confirm/confirm';
import { getCustomTxParamsData } from '../../../../confirm-approve/confirm-approve.util';
import { useConfirmContext } from '../../../../context/confirm';
import { useAssetDetails } from '../../../../hooks/useAssetDetails';
import { selectConfirmationAdvancedDetailsOpen } from '../../../../selectors/preferences';
import { AdvancedDetails } from '../shared/advanced-details/advanced-details';
import { GasFeesSection } from '../shared/gas-fees-section/gas-fees-section';
import { ApproveDetails } from './approve-details/approve-details';
import { ApproveStaticSimulation } from './approve-static-simulation/approve-static-simulation';
import { EditSpendingCapModal } from './edit-spending-cap-modal/edit-spending-cap-modal';
import { useIsNFT } from './hooks/use-is-nft';
import { useTransactionGasEstimate } from './hooks/use-transaction-gas-estimate';
import { SpendingCap } from './spending-cap/spending-cap';

const ApproveInfo = () => {
  const dispatch = useDispatch();

  const { currentConfirmation: transactionMeta } = useConfirmContext() as {
    currentConfirmation: TransactionMeta;
  };

  const showAdvancedDetails = useSelector(
    selectConfirmationAdvancedDetailsOpen,
  );

  const { isNFT } = useIsNFT(transactionMeta);

  const [isOpenEditSpendingCapModal, setIsOpenEditSpendingCapModal] =
    useState(false);
  const [customSpendingCap, setCustomSpendingCap] = useState('');

  const { decimals } = useAssetDetails(
    transactionMeta?.txParams?.to,
    transactionMeta?.txParams?.from,
    transactionMeta?.txParams?.data,
  );

  const customTxParamsData = useMemo(() => {
    return getCustomTxParamsData(transactionMeta?.txParams?.data, {
      customPermissionAmount: customSpendingCap || '0',
      decimals,
    });
  }, [customSpendingCap, transactionMeta?.txParams?.data, decimals]);

  const { estimatedGasLimit } = useTransactionGasEstimate(
    transactionMeta,
    customTxParamsData,
    customSpendingCap,
  );

  const [shouldUpdateConfirmation, setShouldUpdateConfirmation] =
    useState(false);
  useEffect(() => {
    if (shouldUpdateConfirmation && estimatedGasLimit) {
      transactionMeta.txParams.data = customTxParamsData;
      transactionMeta.txParams.gas = hexToDecimal(estimatedGasLimit as string);

      dispatch(updateCurrentConfirmation(transactionMeta));
      setShouldUpdateConfirmation(false);
    }
  }, [
    shouldUpdateConfirmation,
    estimatedGasLimit,
    customTxParamsData,
    transactionMeta,
    dispatch,
  ]);

  const setCustomSpendingCapCandidate = (newValue: string) => {
    const value = parseInt(newValue, 10);
    // coerce negative numbers to zero
    setCustomSpendingCap(value < 0 ? '0' : newValue);
    setShouldUpdateConfirmation(true);
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
