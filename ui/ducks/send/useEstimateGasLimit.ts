import { useDispatch, useSelector } from 'react-redux';
import {
  calculateGasTotal,
  computeEstimatedGasLimit,
  getCurrentDraftTransaction,
  getSendAsset,
  getSendMaxModeState,
  getSendStage,
  SEND_STAGES,
  updateAmountToMax,
  updateGasLimit,
  updateLayer1Fees,
  validateAmountField,
  validateGasField,
  validateSendState,
} from './send';
import {
  getCurrentChainId,
  getIsNonStandardEthChain,
  getSelectedInternalAccountWithBalance,
  getUnapprovedTransactions,
} from '../../selectors';
import { getLayer1GasFee } from '../../store/actions';
import { estimateGasLimitForSend } from './helpers';
import { getBlockGasLimit } from '../metamask/metamask';
import { setCustomGasLimit } from '../gas/gas.duck';
import { useEffect, useMemo } from 'react';
import { AssetType } from '../../../shared/constants/transaction';

export const useEstimateGasLimit = async () => {
  const dispatch = useDispatch();

  const draftTransaction = useSelector(getCurrentDraftTransaction);
  const unapprovedTxs = useSelector(getUnapprovedTransactions);
  const transaction = unapprovedTxs[draftTransaction.id];
  const isNonStandardEthChain = useSelector(getIsNonStandardEthChain);
  const chainId = useSelector(getCurrentChainId);
  const selectedAccount = useSelector(getSelectedInternalAccountWithBalance);

  const isMaxMode = useSelector(getSendMaxModeState);
  const sendStage = useSelector(getSendStage);

  const sendAsset = useSelector(getSendAsset);
  const blockGasLimit = useSelector(getBlockGasLimit);

  const gasTotalForLayer1 = useMemo(() => {
    const f = dispatch(
      getLayer1GasFee({
        transactionParams: {
          gasPrice: draftTransaction.gas.gasPrice,
          gas: draftTransaction.gas.gasLimit,
          to: draftTransaction.recipient.address?.toLowerCase(),
          value: isMaxMode
            ? selectedAccount.balance
            : draftTransaction.amount.value,
          from: selectedAccount.address,
          data: draftTransaction.userInputHexData,
          type: '0x0',
        },
        chainId,
      }),
    );
    return f;
  }, [
    draftTransaction?.amount,
    draftTransaction?.recipient,
    draftTransaction?.receiveAsset,
    draftTransaction?.sendAsset,
    dispatch,
  ]);

  const gasLimit = useMemo(async () => {
    if (
      sendStage !== SEND_STAGES.EDIT ||
      !transaction.dappSuggestedGasFees?.gas ||
      !transaction.userEditedGasLimit
    ) {
      const gasLimit_ = await estimateGasLimitForSend({
        gasPrice: draftTransaction.gas.gasPrice,
        blockGasLimit: blockGasLimit,
        selectedAddress: selectedAccount.address,
        sendToken: draftTransaction.sendAsset.details,
        to: draftTransaction.recipient.address?.toLowerCase(),
        value: draftTransaction.amount.value,
        data: draftTransaction.userInputHexData,
        isNonStandardEthChain,
        chainId,
        gasLimit: draftTransaction.gas.gasLimit,
      });
      dispatch(setCustomGasLimit(gasLimit_));
      return gasLimit_;
    }
    return null;
  }, [
    draftTransaction?.amount,
    draftTransaction?.recipient,
    draftTransaction?.receiveAsset,
    draftTransaction?.sendAsset,
    dispatch,
  ]);

  useEffect(() => {
    dispatch(computeEstimatedGasLimit());
  }, [gasLimit, gasTotalForLayer1]);

  useEffect(() => {
    const getGasLimit = async () => await gasLimit;

    getGasLimit().then((g) => {
      if (draftTransaction) {
        dispatch(updateGasLimit(g));
        dispatch(calculateGasTotal());

        if (isMaxMode && sendAsset?.type === AssetType.native) {
          dispatch(updateAmountToMax());
        }
        dispatch(validateAmountField());
        dispatch(validateGasField());
        dispatch(validateSendState());
      }
    });
  }, [gasLimit, draftTransaction]);

  // TODO fix this
  // useEffect(() => {
  //   const getGasTotalForLayer1 = async () => await gasTotalForLayer1;

  //   dispatch(updateLayer1Fees(getGasTotalForLayer1));
  //   if (isMaxMode && sendAsset?.type === AssetType.native) {
  //     dispatch(updateAmountToMax());
  //   }
  // }, [gasTotalForLayer1, draftTransaction]);

  return null;
};
