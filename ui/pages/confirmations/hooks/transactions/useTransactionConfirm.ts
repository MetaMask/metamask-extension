import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { HardwareWalletError } from '@metamask/hw-wallet-sdk';
import { cloneDeep } from 'lodash';
import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { CONFIRM_TRANSACTION_ROUTE } from '../../../../helpers/constants/routes';
import { getCustomNonceValue } from '../../../../selectors';
import { useConfirmContext } from '../../context/confirm';
import { useSelectedGasFeeToken } from '../../components/confirm/info/hooks/useGasFeeToken';
import { updateAndApproveTx } from '../../../../store/actions';
import { useIsGaslessSupported } from '../gas/useIsGaslessSupported';
import { useGaslessSupportedSmartTransactions } from '../gas/useGaslessSupportedSmartTransactions';
import {
  isRetryableHardwareWalletError,
  useHardwareWalletError,
} from '../../../../contexts/hardware-wallets';
import { useConfirmationNavigation } from '../useConfirmationNavigation';
import { useConfirmActions } from '../useConfirmActions';
import { useShieldConfirm } from './useShieldConfirm';
import { useDappSwapActions } from './dapp-swap-comparison/useDappSwapActions';

/**
 * Hook to handle transaction confirmation flow.
 * Handles all post-confirmation logic internally including:
 * - Navigation to next confirmation or recreated transaction
 * - Error modal display for hardware wallet rejections
 * - State reset after successful confirmation
 */
export function useTransactionConfirm() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showErrorModal } = useHardwareWalletError();
  const { navigateNext } = useConfirmationNavigation();
  const { resetTransactionState } = useConfirmActions();
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

  const onTransactionConfirm = useCallback(async (): Promise<void> => {
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
      // Approve the transaction
      // - Returns normally on success
      // - Throws HardwareWalletError with recreatedTxId if user rejected on hardware device
      // - Throws other errors for actual failures
      await dispatch(updateAndApproveTx(newTransactionMeta, true, ''));

      // Transaction was successfully approved and submitted
      onDappSwapCompleted();
      navigateNext(transactionMeta.id);
      resetTransactionState();
    } catch (error) {
      // Handle shield subscription navigation cleanup for any error
      handleShieldSubscriptionApprovalTransactionAfterConfirmErr(
        newTransactionMeta,
      );

      // Hardware wallet error with recreatedTxId means user rejected and transaction was recreated
      if (
        error instanceof HardwareWalletError &&
        isRetryableHardwareWalletError(error)
      ) {
        const recreatedTxId = error.metadata?.recreatedTxId as
          | string
          | undefined;

        if (recreatedTxId) {
          // Navigate to the recreated transaction and show informational modal
          navigate(`${CONFIRM_TRANSACTION_ROUTE}/${recreatedTxId}`, {
            replace: true,
          });
          showErrorModal(error);
          return;
        }
      }

      throw error;
    }
  }, [
    newTransactionMeta,
    customNonceValue,
    isGaslessSupportedSTX,
    dispatch,
    navigate,
    navigateNext,
    resetTransactionState,
    showErrorModal,
    transactionMeta?.id,
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
