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
import { updateAndApproveTx } from '../../../../store/actions';
import { useIsGaslessSupported } from '../gas/useIsGaslessSupported';
import { useGaslessSupportedSmartTransactions } from '../gas/useGaslessSupportedSmartTransactions';
import { useGasSponsorshipPreference } from '../gas/useGasSponsorshipPreference';
import {
  isHardwareWalletError,
  isUserRejectedHardwareWalletError,
  useHardwareWalletError,
} from '../../../../contexts/hardware-wallets';
import { useShieldConfirm } from './useShieldConfirm';
import { useDappSwapActions } from './dapp-swap-comparison/useDappSwapActions';

export function useTransactionConfirm() {
  const dispatch = useDispatch();
  const { showErrorModal } = useHardwareWalletError();
  const customNonceValue = useSelector(getCustomNonceValue);
  const selectedGasFeeToken = useSelectedGasFeeToken();
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const { isSupported: isGaslessSupportedSTX } =
    useGaslessSupportedSmartTransactions();
  const { isSupported: isGaslessSupported } = useIsGaslessSupported();
  const { isSponsorshipOptedOut } = useGasSponsorshipPreference(
    transactionMeta?.chainId,
  );
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

    newTransactionMeta.txParams.maxPriorityFeePerGas =
      selectedGasFeeToken.maxPriorityFeePerGas;
  }, [newTransactionMeta, selectedGasFeeToken]);

  const handleGasless7702 = useCallback(() => {
    newTransactionMeta.isExternalSign = true;
  }, [newTransactionMeta]);

  const {
    handleShieldSubscriptionApprovalTransactionAfterConfirm,
    handleShieldSubscriptionApprovalTransactionAfterConfirmErr,
  } = useShieldConfirm();

  const onTransactionConfirm = useCallback(async (): Promise<boolean> => {
    newTransactionMeta.customNonceValue = customNonceValue;

    updateSwapWithQuoteDetailsIfRequired(newTransactionMeta);

    // If the gasless flow is not supported (e.g. stx is disabled by the user,
    // or 7702 is not supported in the chain), or the user has opted out of
    // gas sponsorship, we override the `isGasFeeSponsored` flag to `false` so
    // the transaction meta object in state has the correct value for the
    // transaction details on the activity list to not show as sponsored. One
    // limitation on the activity list will be that pre-populated transactions
    // on fresh installs will not show as sponsored even if they were because
    // this is not easily observable onchain for all cases.
    newTransactionMeta.isGasFeeSponsored =
      isGaslessSupported &&
      transactionMeta.isGasFeeSponsored &&
      !isSponsorshipOptedOut;

    // Revert the controller's `isExternalSign` flag when this account cannot
    // use an external relay — i.e. gasless is unsupported for the account/chain
    // (such as hardware wallets, which cannot sign EIP-7702 authorization
    // lists) — or the user has opted out of gas sponsorship. The
    // TransactionController sets `isExternalSign = true` whenever
    // `isGasFeeSponsored` is true during gas estimation, regardless of whether
    // an external relay is actually eligible for this account. If we leave it
    // set, the sign step is skipped (no keyring/device call) and, when no relay
    // catches the publish, an unsigned/empty payload reaches
    // `eth_sendRawTransaction` and is rejected by the node.
    const isExternalSignSupported =
      transactionMeta.isExternalSign &&
      (!isGaslessSupported || isSponsorshipOptedOut);
    if (isExternalSignSupported) {
      newTransactionMeta.isExternalSign = false;
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
      onDappSwapCompleted();
      return true;
    } catch (error) {
      handleShieldSubscriptionApprovalTransactionAfterConfirmErr(
        newTransactionMeta,
      );

      if (!isHardwareWalletError(error)) {
        // Non-hardware wallet errors - just rethrow
        throw error;
      }
      if (isUserRejectedHardwareWalletError(error)) {
        // User intentionally rejected on device; do not show hardware error modal.
        return false;
      }
      showErrorModal(error);
      return false;
    }
  }, [
    newTransactionMeta,
    customNonceValue,
    isGaslessSupported,
    isGaslessSupportedSTX,
    isSponsorshipOptedOut,
    transactionMeta?.isGasFeeSponsored,
    transactionMeta?.isExternalSign,
    dispatch,
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
