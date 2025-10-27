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

      navigate(`${TRANSACTION_SHIELD_ROUTE}/?waitForSubscriptionCreation=true`);
    },
    [navigate],
  );

  /**
   * Handle shield subscription approval transaction approval error
   * (navigation)
   *
   * @param txMeta - The transaction meta
   */
  const handleShieldSubscriptionApprovalTransactionAfterConfirmErr =
    useCallback(
      (txMeta: TransactionMeta) => {
        if (txMeta.type !== TransactionType.shieldSubscriptionApprove) {
          return;
        }

        // go back to previous screen from navigate in `handleShieldSubscriptionApprovalTransactionAfterConfirm`
        navigate(-1);
      },
      [navigate],
    );

  const onTransactionConfirm = useCallback(async () => {
    newTransactionMeta.customNonceValue = customNonceValue;

    if (isSmartTransaction) {
      handleSmartTransaction();
    } else if (selectedGasFeeToken) {
      handleGasless7702();
    }

    await dispatch(
      updateAndApproveTx({
        txMeta: newTransactionMeta,
        dontShowLoadingIndicator: true,
        loadingIndicatorMessage: '',
        onBeforeApproveTx: () => {
          // transaction confirmation screen is a full screen modal that appear over the app and will be dismissed after transaction approved
          // navigate to shield settings page first before approving transaction to wait for subscription creation there
          handleShieldSubscriptionApprovalTransactionAfterConfirm(
            newTransactionMeta,
          );
        },
        onApproveTxError: () => {
          handleShieldSubscriptionApprovalTransactionAfterConfirmErr(
            newTransactionMeta,
          );
        },
      }),
    );
  }, [
    customNonceValue,
    dispatch,
    handleGasless7702,
    handleSmartTransaction,
    isSmartTransaction,
    newTransactionMeta,
    selectedGasFeeToken,
    handleShieldSubscriptionApprovalTransactionAfterConfirm,
    handleShieldSubscriptionApprovalTransactionAfterConfirmErr,
  ]);

  return {
    onTransactionConfirm,
  };
}
