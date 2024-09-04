import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useMemo } from 'react';
import {
  getCurrentDraftTransaction,
  getPrevSwapAndSendInput,
  getSelectedAccountAddress,
  getSendStage,
  updateGasEstimates,
} from '../../../ducks/send';
import {
  getCurrentChainId,
  getIsNonStandardEthChain,
  getUnapprovedTransactions,
  txDataSelector,
} from '../../../selectors';
import { useDebounce } from '../../../ducks/send/useDebounce';
import {
  computeEstimatedGasLimitHelper,
  estimateGasLimitForSend,
} from '../../../ducks/send/helpers';
import {
  getBlockGasLimit,
  getNativeCurrency,
} from '../../../ducks/metamask/metamask';

/**
 * Returns an object that resembles the txData.txParams from the Transactions state.
 * While processing gas details for send transaction and edit transaction,
 * the gas data from draftTransaction and unapprovedTx has to be reorganized
 * to mimic the txdata.txParam from a confirmTransaction
 *
 * @returns {object} The transaction data
 */
export const useDraftTransactionWithTxParams = () => {
  const draftTransaction = useSelector(getCurrentDraftTransaction);

  const unapprovedTxs = useSelector(getUnapprovedTransactions);

  let transactionData = {};

  const dispatch = useDispatch();

  const confPage = useSelector((state) => txDataSelector(state));
  const { id: transactionId, dappSuggestedGasFees, layer1GasFee } = confPage;

  const transaction = Object.keys(draftTransaction).length
    ? draftTransaction
    : unapprovedTxs[transactionId] || {};

  const selectedAccountAddress = useSelector(getSelectedAccountAddress);
  const sendStage = useSelector(getSendStage);

  const chainId = useSelector(getCurrentChainId);

  const isNonStandardEthChain = useSelector(getIsNonStandardEthChain);
  const blockGasLimit = useSelector(getBlockGasLimit);
  const prevSwapAndSendInput = useSelector(getPrevSwapAndSendInput);

  console.log('====conf page 0', {
    draftTransaction,
    transaction,
    transactionData,
  });
  const gasLimit = (async () =>
    await estimateGasLimitForSend({
      gasPrice: transaction?.txParams?.gasPrice,
      blockGasLimit,
      selectedAddress: selectedAccountAddress,
      sendToken: prevSwapAndSendInput.sendAsset?.details,
      to: prevSwapAndSendInput.recipient?.address?.toLowerCase(),
      value: prevSwapAndSendInput.amount?.value,
      data: prevSwapAndSendInput?.userInputHexData,
      isNonStandardEthChain,
      chainId,
    }))();

  // const gasLimit_ = await computeEstimatedGasLimitHelper(
  //   transaction,
  //   unapprovedTxs,
  //   isNonStandardEthChain,
  //   chainId,
  //   selectedAccountAddress,
  //   sendStage,
  //   blockGasLimit,
  // );

  console.log('====conf page ', {
    draftTransaction,
    transaction,
    transactionData,
    gasLimit,
  });

  if (Object.keys(draftTransaction).length !== 0) {
    const editingTransaction = unapprovedTxs[draftTransaction.id];
    transactionData = {
      txParams: {
        gasPrice: draftTransaction.gas?.gasPrice,
        gas: editingTransaction?.userEditedGasLimit
          ? editingTransaction?.txParams?.gas
          : gasLimit ?? draftTransaction.gas?.gasLimit,
        maxFeePerGas: editingTransaction?.txParams?.maxFeePerGas
          ? editingTransaction?.txParams?.maxFeePerGas
          : draftTransaction.gas?.maxFeePerGas,
        maxPriorityFeePerGas: editingTransaction?.txParams?.maxPriorityFeePerGas
          ? editingTransaction?.txParams?.maxPriorityFeePerGas
          : draftTransaction.gas?.maxPriorityFeePerGas,
        value: draftTransaction.amount?.value,
        type: draftTransaction.transactionType,
      },
      userFeeLevel: editingTransaction?.userFeeLevel,
    };
  }

  // return transactionData;
  const tx =
    Object.keys(draftTransaction).length === 0 ? transaction : transactionData;
  return {
    ...tx,
    txParams: {
      ...tx.txParams,
      gas: gasLimit ?? tx.txParams.gas,
    },
  };
};
