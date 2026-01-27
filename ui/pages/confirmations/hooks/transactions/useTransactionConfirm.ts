import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { cloneDeep } from 'lodash';
import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { getCustomNonceValue } from '../../../../selectors';
import { useConfirmContext } from '../../context/confirm';
import { useSelectedGasFeeToken } from '../../components/confirm/info/hooks/useGasFeeToken';
import { updateAndApproveTx, displayWarning } from '../../../../store/actions';
import { useIsGaslessSupported } from '../gas/useIsGaslessSupported';
import { useGaslessSupportedSmartTransactions } from '../gas/useGaslessSupportedSmartTransactions';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useShieldConfirm } from './useShieldConfirm';
import { useDappSwapActions } from './dapp-swap-comparison/useDappSwapActions';

export function useTransactionConfirm() {
  const dispatch = useDispatch();
  const t = useI18nContext();
  const customNonceValue = useSelector(getCustomNonceValue);
  const selectedGasFeeToken = useSelectedGasFeeToken();
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const { isSupported: isGaslessSupportedSTX } =
    useGaslessSupportedSmartTransactions();
  const { isSupported: isGaslessSupported } = useIsGaslessSupported();
  const { onDappSwapCompleted, updateSwapWithQuoteDetailsIfRequired } =
    useDappSwapActions();

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

  const {
    handleShieldSubscriptionApprovalTransactionAfterConfirm,
    handleShieldSubscriptionApprovalTransactionAfterConfirmErr,
  } = useShieldConfirm();

  const onTransactionConfirm = useCallback(async () => {
    newTransactionMeta.customNonceValue = customNonceValue;

    updateSwapWithQuoteDetailsIfRequired(newTransactionMeta);

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

      // Handle Ledger device errors with user-friendly messages
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = String(error.message);

        // Check if the error message is an i18n key from the LedgerOffscreenBridge
        if (
          errorMessage === 'ledgerDeviceOpenFailureMessage' ||
          errorMessage === 'ledgerErrorDevicedLocked' ||
          errorMessage === 'ledgerErrorConnectionIssue' ||
          errorMessage === 'ledgerErrorEthAppNotOpen'
        ) {
          // Display the localized error message
          dispatch(displayWarning(t(errorMessage)));
          throw new Error(t(errorMessage));
        } else if (
          // Also handle the original error message patterns
          errorMessage.toLowerCase().includes('device must be opened') ||
          errorMessage.toLowerCase().includes('cannot open device') ||
          errorMessage.toLowerCase().includes('device is not open')
        ) {
          dispatch(displayWarning(t('ledgerDeviceOpenFailureMessage')));
          throw new Error(t('ledgerDeviceOpenFailureMessage'));
        }
      }

      throw error;
    }

    onDappSwapCompleted();
  }, [
    newTransactionMeta,
    customNonceValue,
    isGaslessSupportedSTX,
    dispatch,
    t,
    handleSmartTransaction,
    handleGasless7702,
    selectedGasFeeToken,
    handleShieldSubscriptionApprovalTransactionAfterConfirm,
    handleShieldSubscriptionApprovalTransactionAfterConfirmErr,
    onDappSwapCompleted,
    updateSwapWithQuoteDetailsIfRequired,
  ]);

  return {
    onTransactionConfirm,
  };
}
