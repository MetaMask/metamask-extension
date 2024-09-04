import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  computeEstimatedGasLimit,
  getAmountMode,
  getCurrentDraftTransaction,
  getEip1559support,
  getSelectedAccountAddress,
  getSendMaxModeState,
  getSendStage,
  signTransaction as sendSignTransaction,
} from './send';
import { useHistory } from 'react-router-dom';
import {
  getCurrentChainId,
  getIsNonStandardEthChain,
  getUnapprovedTransactions,
} from '../../selectors';
import { getBlockGasLimit, getNativeCurrency } from '../metamask/metamask';
import { computeEstimatedGasLimitHelper } from './helpers';

export const useSignTransaction = () => {
  const history = useHistory();
  const dispatch = useDispatch();

  const isMaxMode = useSelector(getSendMaxModeState);
  const draftTransaction = useSelector(getCurrentDraftTransaction);
  const eip1559support = useSelector(getEip1559support);
  const selectedAccountAddress = useSelector(getSelectedAccountAddress);
  const sendStage = useSelector(getSendStage);
  const amountMode = useSelector(getAmountMode);

  const unapprovedTxs = useSelector(getUnapprovedTransactions);
  const chainId = useSelector(getCurrentChainId);
  const nativeCurrency = useSelector(getNativeCurrency);

  const isNonStandardEthChain = useSelector(getIsNonStandardEthChain);
  const blockGasLimit = useSelector(getBlockGasLimit);

  const signTransaction = useCallback(async () => {
    //const gasEstimates = await dispatch(computeEstimatedGasLimit());

    const gasLimit = await computeEstimatedGasLimitHelper(
      draftTransaction,
      unapprovedTxs,
      isNonStandardEthChain,
      chainId,
      selectedAccountAddress,
      sendStage,
      blockGasLimit,
    );

    console.log('====gasLimit override', gasLimit);
    dispatch(
      sendSignTransaction(
        history,
        eip1559support,
        selectedAccountAddress,
        draftTransaction,
        sendStage,
        amountMode,
        unapprovedTxs,
        chainId,
        nativeCurrency,
        gasLimit,
        // gasEstimates.payload.gasLimit,
      ),
    );
  }, [
    draftTransaction,
    unapprovedTxs,
    isNonStandardEthChain,
    chainId,
    selectedAccountAddress,
    sendStage,
    blockGasLimit,
    history,
    eip1559support,
    selectedAccountAddress,
    draftTransaction,
    sendStage,
    amountMode,
    unapprovedTxs,
    chainId,
    nativeCurrency,
  ]);

  return signTransaction;
};
