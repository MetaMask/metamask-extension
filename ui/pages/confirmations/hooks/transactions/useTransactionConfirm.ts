import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { cloneDeep } from 'lodash';
import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../../../../app/scripts/lib/util';
import {
  ENVIRONMENT_TYPE_NOTIFICATION,
  ENVIRONMENT_TYPE_POPUP,
} from '../../../../../shared/constants/app';
import {
  CONFIRM_TRANSACTION_ROUTE,
  DEFAULT_ROUTE,
} from '../../../../helpers/constants/routes';
import { getCustomNonceValue } from '../../../../selectors';
import { useConfirmContext } from '../../context/confirm';
import { useSelectedGasFeeToken } from '../../components/confirm/info/hooks/useGasFeeToken';
import {
  updateAndApproveTx,
  setPendingHardwareSigning,
  closeCurrentNotificationWindow,
} from '../../../../store/actions';
import { useIsGaslessSupported } from '../gas/useIsGaslessSupported';
import { useGaslessSupportedSmartTransactions } from '../gas/useGaslessSupportedSmartTransactions';
import {
  isHardwareWalletError,
  isRetryableHardwareWalletError,
  isUserRejectedHardwareWalletError,
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { navigateNext: _navigateNext } = useConfirmationNavigation();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { resetTransactionState: _resetTransactionState } = useConfirmActions();
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
      // navigateNext(transactionMeta.id);
      // resetTransactionState();
    } catch (error) {
      const isHwError = isHardwareWalletError(error);

      // Extract error details using duck typing for serialized errors
      const errorObj = error as {
        code?: number;
        metadata?: Record<string, unknown>;
        data?: { code?: number; metadata?: Record<string, unknown> };
      };
      const errorMetadata = errorObj?.metadata ?? errorObj?.data?.metadata;
      const recreatedTxId = errorMetadata?.recreatedTxId as string | undefined;

      if (!isHwError) {
        // Non-hardware wallet errors - just rethrow
        console.log('[HW_DEBUG 13] Not a HardwareWalletError, rethrowing');
        throw error;
      }

      // Handle shield subscription navigation cleanup for any error
      handleShieldSubscriptionApprovalTransactionAfterConfirmErr(
        newTransactionMeta,
      );

      // Check if we're in a popup/notification window
      // In popup mode, we should NOT navigate away on error because:
      // 1. Navigation would close the popup or navigate away from the confirmation
      // 2. The error modal needs to stay on the confirmation page for retry to work
      const environmentType = getEnvironmentType();
      const isPopupEnvironment =
        environmentType === ENVIRONMENT_TYPE_NOTIFICATION ||
        environmentType === ENVIRONMENT_TYPE_POPUP;

      // Check for user rejection first - user deliberately rejected on device.
      // The transaction approval has already been processed by approveHardwareTransaction,
      // so we just need to:
      // 1. Clear pendingHardwareSigning so closeCurrentNotificationWindow isn't blocked
      // 2. Close the popup directly
      if (isUserRejectedHardwareWalletError(error)) {
        // Clear pendingHardwareSigning and close the popup directly.
        // The approval is already gone (processed by approveHardwareTransaction),
        // so rejectPendingApproval would do nothing useful.
        dispatch(setPendingHardwareSigning(false));
        dispatch(closeCurrentNotificationWindow());
        return;
      }

      if (isRetryableHardwareWalletError(error)) {
        // Clear pendingHardwareSigning so the confirm button is enabled for retry
        dispatch(setPendingHardwareSigning(false));

        // IMPORTANT: Always show the modal FIRST, before any navigation.
        // This ensures isHardwareWalletErrorModalVisible is true before React
        // processes any re-renders from navigation, which prevents the popup
        // from closing due to the navigation guards checking modal visibility.
        console.log('[HW_DEBUG 16] Calling showErrorModal NOW');
        showErrorModal(error);
        console.log(
          '[HW_DEBUG 17] showErrorModal called - modal should be visible',
        );

        if (recreatedTxId) {
          // Navigate to the recreated transaction after modal is shown
          console.log(
            '[HW_DEBUG 18] Navigating to recreated tx:',
            recreatedTxId,
          );
          navigate(`${CONFIRM_TRANSACTION_ROUTE}/${recreatedTxId}`, {
            replace: true,
          });
          console.log('[HW_DEBUG 19] Navigation dispatched, returning');
          return;
        }

        // Retryable error without recreatedTxId - modal already shown, stay on current page
        // This allows the user to retry the signing from the same confirmation
        return;
      }

      // For non-retryable hardware wallet errors (e.g., UNKNOWN_ERROR),
      // show the error modal. In popup mode, stay on the confirmation page
      // so the user can dismiss the modal and cancel manually.
      // In fullscreen mode, navigate to home page.
      showErrorModal(error);

      if (!isPopupEnvironment) {
        // Only navigate away in fullscreen/sidepanel mode
        navigate(DEFAULT_ROUTE, { replace: true });
      }
      return;
    }

    onDappSwapCompleted();
  }, [
    newTransactionMeta,
    customNonceValue,
    isGaslessSupportedSTX,
    dispatch,
    navigate,
    showErrorModal,
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
