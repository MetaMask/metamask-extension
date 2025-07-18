import { TransactionMeta } from '@metamask/transaction-controller';
import { useDispatch, useSelector } from 'react-redux';
import { cloneDeep } from 'lodash';
import { useCallback, useMemo } from 'react';
import { getCustomNonceValue } from '../../../../selectors';
import { useConfirmContext } from '../../context/confirm';
import { useSelectedGasFeeToken } from '../../components/confirm/info/hooks/useGasFeeToken';
import { updateAndApproveTx } from '../../../../store/actions';
import {
  getIsSmartTransaction,
  type SmartTransactionsState,
} from '../../../../../shared/modules/selectors';

export function useTransactionConfirm() {
  const dispatch = useDispatch();
  const customNonceValue = useSelector(getCustomNonceValue);
  const selectedGasFeeToken = useSelectedGasFeeToken();
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();
  const isSmartTransaction = useSelector((state: SmartTransactionsState) =>
    getIsSmartTransaction(state, transactionMeta?.chainId),
  );

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

  const onTransactionConfirm = useCallback(async () => {
    newTransactionMeta.customNonceValue = customNonceValue;

    if (isSmartTransaction) {
      handleSmartTransaction();
    } else if (selectedGasFeeToken) {
      handleGasless7702();
    }

    // TODO: Fix Redux dispatch typing - implement useAppDispatch pattern
    // Discussion: https://github.com/MetaMask/metamask-extension/pull/32052#discussion_r2195789610
    // Solution: Update MetaMaskReduxDispatch type to properly handle async thunks
    // Extract thunk dispatch calls to separate issue - these are TypeScript/ESLint typing issues
    // eslint-disable-next-line @typescript-eslint/await-thenable
    await dispatch(updateAndApproveTx(newTransactionMeta, true, ''));
  }, [
    customNonceValue,
    dispatch,
    handleGasless7702,
    handleSmartTransaction,
    isSmartTransaction,
    newTransactionMeta,
    selectedGasFeeToken,
  ]);

  return {
    onTransactionConfirm,
  };
}
