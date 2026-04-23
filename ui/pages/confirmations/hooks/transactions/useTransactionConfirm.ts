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
import {
  isHardwareWalletError,
  isUserRejectedHardwareWalletError,
  useHardwareWalletError,
} from '../../../../contexts/hardware-wallets';
import { useGasSponsorshipEligibility } from '../gas/useGasSponsorshipEligibility';
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
  const { isEligible: isGasSponsorshipEligible } =
    useGasSponsorshipEligibility();
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

    // Smart transaction flow is explicitly excluded from sponsorship.
    newTransactionMeta.isGasFeeSponsored = false;

    newTransactionMeta.txParams.maxPriorityFeePerGas =
      selectedGasFeeToken.maxPriorityFeePerGas;
  }, [newTransactionMeta, selectedGasFeeToken]);

  const handleGasless7702 = useCallback(
    (isSponsored: boolean) => {
      newTransactionMeta.isExternalSign = true;
      newTransactionMeta.isGasFeeSponsored =
        isSponsored ||
        (isGaslessSupported && Boolean(transactionMeta.isGasFeeSponsored));
    },
    [
      isGaslessSupported,
      newTransactionMeta,
      transactionMeta?.isGasFeeSponsored,
    ],
  );

  const {
    handleShieldSubscriptionApprovalTransactionAfterConfirm,
    handleShieldSubscriptionApprovalTransactionAfterConfirmErr,
  } = useShieldConfirm();

  const onTransactionConfirm = useCallback(async (): Promise<boolean> => {
    newTransactionMeta.customNonceValue = customNonceValue;

    updateSwapWithQuoteDetailsIfRequired(newTransactionMeta);

    if (isGaslessSupportedSTX) {
      handleSmartTransaction();
    } else if (selectedGasFeeToken || isGasSponsorshipEligible) {
      handleGasless7702(isGasSponsorshipEligible);
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
    isGaslessSupportedSTX,
    dispatch,
    showErrorModal,
    handleSmartTransaction,
    handleGasless7702,
    isGasSponsorshipEligible,
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
