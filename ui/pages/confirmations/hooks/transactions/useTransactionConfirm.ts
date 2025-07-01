import {
  BatchTransactionParams,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { useDispatch, useSelector } from 'react-redux';
import { cloneDeep } from 'lodash';
import { useCallback, useMemo } from 'react';
import { QuoteResponse } from '@metamask/bridge-controller';
import {
  getCustomNonceValue,
  selectIntentQuoteForTransaction,
} from '../../../../selectors';
import { useConfirmContext } from '../../context/confirm';
import { useSelectedGasFeeToken } from '../../components/confirm/info/hooks/useGasFeeToken';
import { updateAndApproveTx } from '../../../../store/actions';
import {
  getIsSmartTransaction,
  type SmartTransactionsState,
} from '../../../../../shared/modules/selectors';
import { ConfirmMetamaskState } from '../../types/confirm';

export function useTransactionConfirm() {
  const dispatch = useDispatch();
  const customNonceValue = useSelector(getCustomNonceValue);
  const selectedGasFeeToken = useSelectedGasFeeToken();

  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const isSmartTransaction = useSelector((state: SmartTransactionsState) =>
    getIsSmartTransaction(state, transactionMeta?.chainId),
  );

  const intentQuotes = useSelector((state: ConfirmMetamaskState) =>
    selectIntentQuoteForTransaction(state, transactionMeta?.id),
  ) as QuoteResponse[] | undefined;

  const newTransactionMeta = useMemo(
    () => cloneDeep(transactionMeta),
    [transactionMeta],
  );

  const handleSmartTransaction = useCallback(() => {
    if (!selectedGasFeeToken) {
      return;
    }

    newTransactionMeta.batchTransactions = [
      selectedGasFeeToken.transferTransaction,
    ];

    newTransactionMeta.txParams.gas = selectedGasFeeToken.gas;
    newTransactionMeta.txParams.maxFeePerGas = selectedGasFeeToken.maxFeePerGas;

    newTransactionMeta.txParams.maxPriorityFeePerGas =
      selectedGasFeeToken.maxPriorityFeePerGas;
  }, [selectedGasFeeToken, newTransactionMeta]);

  const handleGasless7702 = useCallback(() => {
    newTransactionMeta.isExternalSign = true;
  }, [newTransactionMeta]);

  const handleIntents = useCallback(() => {
    if (!intentQuotes?.length) {
      return;
    }

    // const { approval: mainApproval, trade: mainTrade } = mainIntentQuote;
    // const { approval: gasApproval, trade: gasTrade } = gasIntentQuote || {};

    // const isSwap =
    //   mainIntentQuote.quote.srcChainId === mainIntentQuote.quote.destChainId;

    // if (!isSwap) {
    //   return;
    // }

    // newTransactionMeta.batchTransactions = [];

    // if (gasApproval) {
    //   newTransactionMeta.batchTransactions.push(
    //     gasApproval as BatchTransactionParams,
    //   );
    // }

    // if (gasTrade) {
    //   newTransactionMeta.batchTransactions.push(
    //     gasTrade as BatchTransactionParams,
    //   );
    // }

    // if (mainApproval) {
    //   newTransactionMeta.batchTransactions.push(
    //     mainApproval as BatchTransactionParams,
    //   );
    // }

    // newTransactionMeta.batchTransactions.push(
    //   mainTrade as BatchTransactionParams,
    // );
  }, [intentQuotes, newTransactionMeta]);

  const onTransactionConfirm = useCallback(async () => {
    newTransactionMeta.customNonceValue = customNonceValue;

    if (isSmartTransaction) {
      handleSmartTransaction();
    } else if (selectedGasFeeToken) {
      handleGasless7702();
    }

    handleIntents();

    await dispatch(updateAndApproveTx(newTransactionMeta, true, ''));
  }, [
    customNonceValue,
    dispatch,
    handleGasless7702,
    handleIntents,
    handleSmartTransaction,
    isSmartTransaction,
    newTransactionMeta,
    selectedGasFeeToken,
  ]);

  return {
    onTransactionConfirm,
  };
}
