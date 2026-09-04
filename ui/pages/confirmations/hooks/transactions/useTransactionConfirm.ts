import {
  prepareTransactionForApproval,
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
import { useIsHardwareWalletAccount } from '../../../../hooks/useIsHardwareWalletAccount';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useShieldConfirm } from './useShieldConfirm';
import { useDappSwapActions } from './dapp-swap-comparison/useDappSwapActions';
import { useMoneyAccountWithdrawConfirm } from './useMoneyAccountWithdrawConfirm';
import { useTransactionPayingAccount } from './useTransactionPayingAccount';

export function useTransactionConfirm() {
  const dispatch = useDispatch();
  const t = useI18nContext();
  const { showErrorModal } = useHardwareWalletError();
  const customNonceValue = useSelector(getCustomNonceValue);
  const selectedGasFeeToken = useSelectedGasFeeToken();
  const { currentConfirmation: transactionMeta, isAmountPending } =
    useConfirmContext<TransactionMeta>();
  const isMoneyAccountWithdraw = hasTransactionType(transactionMeta, [
    TransactionType.moneyAccountWithdraw,
  ]);
  const { prepareWithdrawTransaction } = useMoneyAccountWithdrawConfirm();
  const payingAccount = useTransactionPayingAccount();
  const isPayingWithHardwareWallet = useIsHardwareWalletAccount(payingAccount);

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
    // The field can already show the new amount while publish would still
    // execute the previous quote. The footer blocks the click; this covers
    // any other confirm path.
    if (isAmountPending) {
      return false;
    }

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

    const preparedTransaction = prepareTransactionForApproval({
      transactionMeta: txToApprove,
      sponsorship: {
        available: Boolean(transactionMeta.isGasFeeSponsored),
        supported: isGaslessSupported,
        optedOut: isSponsorshipOptedOut,
        required: isMoneyAccountWithdraw,
      },
      signing: {
        // Money Account withdrawals require their relay even when the generic
        // gasless eligibility hook disagrees; hardware sendBundle signs locally.
        externalSigningSupported:
          isMoneyAccountWithdraw ||
          (Boolean(transactionMeta.isExternalSign) &&
            !shouldRedirectToHwSigningPage),
      },
    });
    txToApprove = preparedTransaction.transactionMeta;

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
      await dispatch(
        updateAndApproveTx(
          txToApprove,
          !isPayingWithHardwareWallet,
          isPayingWithHardwareWallet ? t('swapConfirmWithHwWallet') : '',
          payingAccount,
        ),
      );
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
    isAmountPending,
    isGaslessSupported,
    isGaslessSupportedSTX,
    isMoneyAccountWithdraw,
    isPayingWithHardwareWallet,
    isSponsorshipOptedOut,
    onDappSwapCompleted,
    payingAccount,
    prepareWithdrawTransaction,
    redirectToHwSigningPage,
    selectedGasFeeToken,
    shouldRedirectToHwSigningPage,
    showErrorModal,
    transactionMeta,
    t,
    updateSwapWithQuoteDetailsIfRequired,
  ]);

  return {
    onTransactionConfirm,
  };
}
