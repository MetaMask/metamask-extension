import {
  BatchTransaction,
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { TxData } from '@metamask/bridge-controller';
import { cloneDeep } from 'lodash';
import { toHex } from '@metamask/controller-utils';
import { useCallback, useMemo } from 'react';

import { useDispatch, useSelector } from 'react-redux';
import { getCustomNonceValue } from '../../../../selectors';
import { useConfirmContext } from '../../context/confirm';
import { useSelectedGasFeeToken } from '../../components/confirm/info/hooks/useGasFeeToken';
import { updateAndApproveTx } from '../../../../store/actions';
import { useIsGaslessSupported } from '../gas/useIsGaslessSupported';
import { useGaslessSupportedSmartTransactions } from '../gas/useGaslessSupportedSmartTransactions';
import { useDappSwapComparisonMetrics } from './dapp-swap-comparison/useDappSwapComparisonMetrics';
import { useShieldConfirm } from './useShieldConfirm';

export function useTransactionConfirm() {
  const dispatch = useDispatch();
  const customNonceValue = useSelector(getCustomNonceValue);
  const selectedGasFeeToken = useSelectedGasFeeToken();
  const { currentConfirmation: transactionMeta, quoteSelectedForMMSwap } =
    useConfirmContext<TransactionMeta>();

  const { isSupported: isGaslessSupportedSTX } =
    useGaslessSupportedSmartTransactions();
  const { isSupported: isGaslessSupported } = useIsGaslessSupported();
  const { captureSwapSubmit } = useDappSwapComparisonMetrics();

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

    // If the gasless flow is not supported (e.g. stx is disabled by the user,
    // or 7702 is not supported in the chain), we override the
    // `isGasFeeSponsored` flag to `false` so the transaction meta object in
    // state has the correct value for the transaction details on the activity
    // list to not show as sponsored. One limitation on the activity list will
    // be that pre-populated transactions on fresh installs will not show as
    // sponsored even if they were because this is not easily observable onchain
    // for all cases.
    newTransactionMeta.isGasFeeSponsored =
      isGaslessSupported && transactionMeta.isGasFeeSponsored;

    newTransactionMeta.txParams.maxPriorityFeePerGas =
      selectedGasFeeToken.maxPriorityFeePerGas;
  }, [
    isGaslessSupported,
    newTransactionMeta,
    selectedGasFeeToken,
    transactionMeta?.isGasFeeSponsored,
  ]);

  const handleGasless7702 = useCallback(() => {
    newTransactionMeta.isExternalSign = true;
    newTransactionMeta.isGasFeeSponsored =
      isGaslessSupported && transactionMeta.isGasFeeSponsored;
  }, [
    isGaslessSupported,
    newTransactionMeta,
    transactionMeta?.isGasFeeSponsored,
  ]);

  const updateSwapWithQuoteDetails = useCallback(() => {
    const { value, gasLimit, data, to } =
      quoteSelectedForMMSwap?.trade as TxData;
    newTransactionMeta.txParams = {
      ...newTransactionMeta.txParams,
      value,
      to,
      gas: toHex(gasLimit ?? 0),
      data,
    };
    newTransactionMeta.batchTransactions = [
      quoteSelectedForMMSwap?.approval as BatchTransaction,
    ];
    newTransactionMeta.nestedTransactions = undefined;
  }, [newTransactionMeta, quoteSelectedForMMSwap]);

  const {
    handleShieldSubscriptionApprovalTransactionAfterConfirm,
    handleShieldSubscriptionApprovalTransactionAfterConfirmErr,
  } = useShieldConfirm();

  const onTransactionConfirm = useCallback(async () => {
    newTransactionMeta.customNonceValue = customNonceValue;

    if (quoteSelectedForMMSwap) {
      updateSwapWithQuoteDetails();
    }

    if (isGaslessSupportedSTX) {
      handleSmartTransaction();
    } else if (selectedGasFeeToken) {
      handleGasless7702();
    }

    // transaction confirmation screen is a full screen modal that appear over the app and will be dismissed after transaction approved
    // navigate to shield settings page first before approving transaction to wait for subscription creation there
    handleShieldSubscriptionApprovalTransactionAfterConfirm(newTransactionMeta);
    try {
      await dispatch(updateAndApproveTx(newTransactionMeta, true, ''));
    } catch (error) {
      handleShieldSubscriptionApprovalTransactionAfterConfirmErr(
        newTransactionMeta,
      );
      throw error;
    }

    captureSwapSubmit();
  }, [
    newTransactionMeta,
    customNonceValue,
    isGaslessSupportedSTX,
    dispatch,
    handleSmartTransaction,
    handleGasless7702,
    selectedGasFeeToken,
    handleShieldSubscriptionApprovalTransactionAfterConfirm,
    handleShieldSubscriptionApprovalTransactionAfterConfirmErr,
    captureSwapSubmit,
  ]);

  return {
    onTransactionConfirm,
  };
}
