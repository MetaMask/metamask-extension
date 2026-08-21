import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { cloneDeep } from 'lodash';
import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { hasTransactionType } from '../../../../../shared/lib/transactions.utils';
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
import { useSendBundleHwNavigation } from '../../../../hooks/hardware-wallets/useSendBundleHwNavigation';
import { useDispatch } from '../../../../store/hooks';
import { useShieldConfirm } from './useShieldConfirm';
import { useDappSwapActions } from './dapp-swap-comparison/useDappSwapActions';
import { useMoneyAccountWithdrawConfirm } from './useMoneyAccountWithdrawConfirm';

export function useTransactionConfirm() {
  const dispatch = useDispatch();
  const { showErrorModal } = useHardwareWalletError();
  const customNonceValue = useSelector(getCustomNonceValue);
  const selectedGasFeeToken = useSelectedGasFeeToken();
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();
  const isMoneyAccountWithdraw = hasTransactionType(transactionMeta, [
    TransactionType.moneyAccountWithdraw,
  ]);
  const { prepareWithdrawTransaction } = useMoneyAccountWithdrawConfirm();

  const { isSupported: isGaslessSupportedSTX } =
    useGaslessSupportedSmartTransactions();
  const { isSupported: isGaslessSupported } = useIsGaslessSupported();
  const { isSponsorshipOptedOut } = useGasSponsorshipPreference(
    transactionMeta?.chainId,
  );
  const { onDappSwapCompleted, updateSwapWithQuoteDetailsIfRequired } =
    useDappSwapActions();
  const { shouldRedirectToHwSigningPage, redirectToHwSigningPage } =
    useSendBundleHwNavigation({ transactionMeta });

  const handleSmartTransaction = useCallback(
    (tx: TransactionMeta) => {
      if (!selectedGasFeeToken) {
        return;
      }

      tx.batchTransactions = [
        {
          ...selectedGasFeeToken.transferTransaction,
          type: TransactionType.gasPayment,
        },
      ];

      tx.txParams.gas = selectedGasFeeToken.gas;
      tx.txParams.maxFeePerGas = selectedGasFeeToken.maxFeePerGas;

      tx.txParams.maxPriorityFeePerGas =
        selectedGasFeeToken.maxPriorityFeePerGas;
    },
    [selectedGasFeeToken],
  );

  const handleGasless7702 = useCallback((tx: TransactionMeta) => {
    tx.isExternalSign = true;
  }, []);

  const {
    handleShieldSubscriptionApprovalTransactionAfterConfirm,
    handleShieldSubscriptionApprovalTransactionAfterConfirmErr,
  } = useShieldConfirm();

  const onTransactionConfirm = useCallback(async (): Promise<boolean> => {
    let txToApprove = cloneDeep(transactionMeta);

    if (isMoneyAccountWithdraw) {
      const committed = await prepareWithdrawTransaction(transactionMeta);
      if (!committed) {
        return false;
      }
      txToApprove = committed;
    }

    txToApprove.customNonceValue = customNonceValue;

    updateSwapWithQuoteDetailsIfRequired(txToApprove);

    // If the gasless flow is not supported (e.g. stx is disabled by the user,
    // or 7702 is not supported in the chain), or the user has opted out of
    // gas sponsorship, we override the `isGasFeeSponsored` flag to `false` so
    // the transaction meta object in state has the correct value for the
    // transaction details on the activity list to not show as sponsored. One
    // limitation on the activity list will be that pre-populated transactions
    // on fresh installs will not show as sponsored even if they were because
    // this is not easily observable onchain for all cases.
    //
    // Money Account withdrawals are sponsored on Monad by design (the money
    // account has no native MON). `useIsGaslessSupported` can disagree with
    // the 7702 publish hook; clearing the flag here made the hook skip and
    // published the parent `execute()` instead — which mines and moves
    // nothing when that parent is still the empty placeholder.
    txToApprove.isGasFeeSponsored = isMoneyAccountWithdraw
      ? Boolean(transactionMeta.isGasFeeSponsored) && !isSponsorshipOptedOut
      : isGaslessSupported &&
        transactionMeta.isGasFeeSponsored &&
        !isSponsorshipOptedOut;

    // Revert the controller's `isExternalSign` flag when this account cannot
    // use an external relay — i.e. gasless is unsupported for the account/chain
    // (such as hardware wallets, which cannot sign EIP-7702 authorization
    // lists) — or the user has opted out of gas sponsorship. Hardware wallet
    // sendBundle transactions are gasless but still require local signing. The
    // TransactionController sets `isExternalSign = true` whenever
    // `isGasFeeSponsored` is true during gas estimation, regardless of whether
    // an external relay is actually eligible for this account. If we leave it
    // set, the sign step is skipped (no keyring/device call) and, when no relay
    // catches the publish, an unsigned/empty payload reaches
    // `eth_sendRawTransaction` and is rejected by the node.
    const shouldClearExternalSign =
      transactionMeta.isExternalSign &&
      (!isGaslessSupported ||
        isSponsorshipOptedOut ||
        shouldRedirectToHwSigningPage);
    if (shouldClearExternalSign) {
      txToApprove.isExternalSign = false;
    }

    if (isGaslessSupportedSTX) {
      handleSmartTransaction(txToApprove);
    } else if (selectedGasFeeToken) {
      handleGasless7702(txToApprove);
    }

    if (shouldRedirectToHwSigningPage) {
      redirectToHwSigningPage(txToApprove);
      return false;
    }

    // transaction confirmation screen is a full screen modal that appear over the app and will be dismissed after transaction approved
    // navigate to shield settings page first before approving transaction to wait for subscription creation there
    handleShieldSubscriptionApprovalTransactionAfterConfirm(txToApprove);
    try {
      await dispatch(updateAndApproveTx(txToApprove, true, ''));
      onDappSwapCompleted();
      return true;
    } catch (error) {
      handleShieldSubscriptionApprovalTransactionAfterConfirmErr(txToApprove);

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
    handleGasless7702,
    handleSmartTransaction,
    customNonceValue,
    dispatch,
    handleShieldSubscriptionApprovalTransactionAfterConfirm,
    handleShieldSubscriptionApprovalTransactionAfterConfirmErr,
    isGaslessSupported,
    isGaslessSupportedSTX,
    isMoneyAccountWithdraw,
    isSponsorshipOptedOut,
    onDappSwapCompleted,
    prepareWithdrawTransaction,
    redirectToHwSigningPage,
    selectedGasFeeToken,
    shouldRedirectToHwSigningPage,
    showErrorModal,
    transactionMeta,
    updateSwapWithQuoteDetailsIfRequired,
  ]);

  return {
    onTransactionConfirm,
  };
}
