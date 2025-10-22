import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { useDispatch, useSelector } from 'react-redux';
import { cloneDeep } from 'lodash';
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom-v5-compat';
import { getCustomNonceValue } from '../../../../selectors';
import { useConfirmContext } from '../../context/confirm';
import { useSelectedGasFeeToken } from '../../components/confirm/info/hooks/useGasFeeToken';
import { updateAndApproveTx } from '../../../../store/actions';
import {
  getIsSmartTransaction,
  type SmartTransactionsState,
} from '../../../../../shared/modules/selectors';
import { TRANSACTION_SHIELD_ROUTE } from '../../../../helpers/constants/routes';

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
      {
        ...selectedGasFeeToken.transferTransaction,
        type: TransactionType.gasPayment,
      },
    ];

    newTransactionMeta.txParams.gas = selectedGasFeeToken.gas;
    newTransactionMeta.txParams.maxFeePerGas = selectedGasFeeToken.maxFeePerGas;

    newTransactionMeta.txParams.maxPriorityFeePerGas =
      selectedGasFeeToken.maxPriorityFeePerGas;
  }, [selectedGasFeeToken, newTransactionMeta]);

  const handleGasless7702 = useCallback(() => {
    newTransactionMeta.isExternalSign = true;
  }, [newTransactionMeta]);

  const navigate = useNavigate();
  /**
   * Handle shield subscription approval transaction after confirm in UI
   * (navigation)
   *
   * @param txMeta - The transaction meta
   */
  const handleShieldSubscriptionApprovalTransactionAfterConfirm = useCallback(
    (txMeta: TransactionMeta) => {
      if (txMeta.type !== TransactionType.shieldSubscriptionApprove) {
        return;
      }

      navigate(TRANSACTION_SHIELD_ROUTE);
    },
    [navigate],
  );
  // show loading indicator for shield subscription approval transaction since it will skip the transaction status page and wait for subscription api response
  const shouldShowLoadingIndicator =
    newTransactionMeta.type === TransactionType.shieldSubscriptionApprove;

  const onTransactionConfirm = useCallback(async () => {
    newTransactionMeta.customNonceValue = customNonceValue;

    if (isSmartTransaction) {
      handleSmartTransaction();
    } else if (selectedGasFeeToken) {
      handleGasless7702();
    }

    await dispatch(
      updateAndApproveTx(newTransactionMeta, !shouldShowLoadingIndicator, ''),
    );
    handleShieldSubscriptionApprovalTransactionAfterConfirm(newTransactionMeta);
  }, [
    customNonceValue,
    dispatch,
    handleGasless7702,
    handleSmartTransaction,
    isSmartTransaction,
    newTransactionMeta,
    selectedGasFeeToken,
    shouldShowLoadingIndicator,
    handleShieldSubscriptionApprovalTransactionAfterConfirm,
  ]);

  return {
    onTransactionConfirm,
  };
}
