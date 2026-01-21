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
import {
  updateAndApproveTx,
  UpdateAndApproveTxResult,
} from '../../../../store/actions';
import { useIsGaslessSupported } from '../gas/useIsGaslessSupported';
import { useGaslessSupportedSmartTransactions } from '../gas/useGaslessSupportedSmartTransactions';
import { useShieldConfirm } from './useShieldConfirm';
import { useDappSwapActions } from './dapp-swap-comparison/useDappSwapActions';

/**
 * Result of confirming a transaction.
 * When a hardware wallet transaction is rejected on device and recreated,
 * recreatedTxId contains the new transaction ID to navigate to.
 */
export type TransactionConfirmResult = {
  /**
   * The ID of the recreated transaction when a hardware wallet user
   * rejected on device and the transaction was recreated.
   * undefined when the transaction was successfully submitted.
   */
  recreatedTxId?: string;
};

export function useTransactionConfirm() {
  const dispatch = useDispatch();
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

  const onTransactionConfirm =
    useCallback(async (): Promise<TransactionConfirmResult> => {
      newTransactionMeta.customNonceValue = customNonceValue;

      updateSwapWithQuoteDetailsIfRequired(newTransactionMeta);

      if (isGaslessSupportedSTX) {
        handleSmartTransaction();
      } else if (selectedGasFeeToken) {
        handleGasless7702();
      }

      // transaction confirmation screen is a full screen modal that appear over the app and will be dismissed after transaction approved
      // navigate to shield settings page first before approving transaction to wait for subscription creation there
      handleShieldSubscriptionApprovalTransactionAfterConfirm(
        newTransactionMeta,
      );

      try {
        // For Ledger accounts, prevent closing the popup after confirmation
        // to allow user to see the transaction status while signing on device
        // Returns:
        //   - { txMeta }: Transaction was successfully signed and submitted
        //   - { txMeta: null, recreatedTxId }: Transaction was rejected on hardware device and recreated
        //   - throws: Actual error occurred
        const result = (await dispatch(
          updateAndApproveTx(newTransactionMeta, true, ''),
        )) as unknown as UpdateAndApproveTxResult;

        // Only complete swap flow if transaction was successfully approved and submitted
        // When txMeta is null, the transaction was rejected on hardware device
        // and recreated - return the new tx ID so caller can navigate to it
        if (result.txMeta !== null) {
          onDappSwapCompleted();
        }

        // Return result with recreatedTxId if present
        return { recreatedTxId: result.recreatedTxId };
      } catch (error) {
        // Handle actual errors (not rejections - those return recreatedTxId, not throw)
        console.log('[useTransactionConfirm] error', error);
        handleShieldSubscriptionApprovalTransactionAfterConfirmErr(
          newTransactionMeta,
        );
        throw error;
      }
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
      onDappSwapCompleted,
      updateSwapWithQuoteDetailsIfRequired,
    ]);

  return {
    onTransactionConfirm,
  };
}
