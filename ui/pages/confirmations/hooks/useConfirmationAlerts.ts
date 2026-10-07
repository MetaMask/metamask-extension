import { useMemo } from 'react';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { hasTransactionType } from '../../../../shared/lib/transactions.utils';
import { Alert } from '../../../ducks/confirm-alerts/confirm-alerts';
import { PAY_TRANSACTION_TYPES } from '../constants/pay';
import { useConfirmContext } from '../context/confirm';
import useAccountMismatchAlerts from './alerts/signatures/useAccountMismatchAlerts';
import useDomainMismatchAlerts from './alerts/signatures/useDomainMismatchAlerts';
import { useAccountTypeUpgrade } from './alerts/transactions/useAccountTypeUpgrade';
import { useFirstTimeInteractionAlert } from './alerts/transactions/useFirstTimeInteractionAlert';
import { useGasEstimateFailedAlerts } from './alerts/transactions/useGasEstimateFailedAlerts';
import { useGasFeeLowAlerts } from './alerts/transactions/useGasFeeLowAlerts';
import { useGasSponsorshipWarningAlerts } from './alerts/transactions/useGasSponsorshipWarningAlerts';
import { useGasTooLowAlerts } from './alerts/transactions/useGasTooLowAlerts';
import { useAddressPoisoningAlert } from './alerts/transactions/useAddressPoisoningAlert';
import { useSuggestedGasFeeHighAlert } from './alerts/transactions/useSuggestedGasFeeHighAlert';
import { useInsufficientBalanceAlerts } from './alerts/transactions/useInsufficientBalanceAlerts';
import { useAccountNoFundsAlert } from './alerts/transactions/useAccountNoFundsAlert';
import { useInsufficientPayTokenBalanceAlert } from './alerts/transactions/useInsufficientPayTokenBalanceAlert';
import { useInsufficientMoneyAccountBalanceAlert } from './alerts/transactions/useInsufficientMoneyAccountBalanceAlert';
import { usePerpsWithdrawInsufficientBalanceAlert } from './alerts/transactions/usePerpsWithdrawInsufficientBalanceAlert';
import { useTransactionDepositLimitAlert } from './alerts/transactions/useTransactionDepositLimitAlert';
import { useMultipleApprovalsAlerts } from './alerts/transactions/useMultipleApprovalsAlerts';
import { useNoGasPriceAlerts } from './alerts/transactions/useNoGasPriceAlerts';
import { useNoPayTokenQuotesAlert } from './alerts/transactions/useNoPayTokenQuotesAlert';
import { useNonContractAddressAlerts } from './alerts/transactions/useNonContractAddressAlerts';
import { usePendingTransactionAlerts } from './alerts/transactions/usePendingTransactionAlerts';
import { usePayHardwareAccountAlert } from './alerts/transactions/usePayHardwareAccountAlert';
import { useSigningOrSubmittingAlerts } from './alerts/transactions/useSigningOrSubmittingAlerts';
import useBlockaidAlerts from './alerts/useBlockaidAlerts';
import useConfirmationOriginAlerts from './alerts/useConfirmationOriginAlerts';
import { useNetworkAndOriginSwitchingAlerts } from './alerts/useNetworkAndOriginSwitchingAlerts';
import { useSelectedAccountAlerts } from './alerts/useSelectedAccountAlerts';
import { useAddressTrustSignalAlerts } from './alerts/useAddressTrustSignalAlerts';
import { useOriginTrustSignalAlerts } from './alerts/useOriginTrustSignalAlerts';
import { useSpenderAlerts } from './alerts/useSpenderAlerts';
import { useTokenTrustSignalAlerts } from './alerts/useTokenTrustSignalAlerts';
import { useShieldCoverageAlert } from './alerts/useShieldCoverageAlert';
import { useAddEthereumChainAlerts } from './alerts/useAddEthereumChainAlerts';
import { useBurnAddressAlert } from './alerts/transactions/useBurnAddressAlert';
import { useTokenContractAlert } from './alerts/transactions/useTokenContractAlert';

function useSignatureAlerts(): Alert[] {
  const accountMismatchAlerts = useAccountMismatchAlerts();
  const domainMismatchAlerts = useDomainMismatchAlerts();

  return useMemo(
    () => [...accountMismatchAlerts, ...domainMismatchAlerts],
    [accountMismatchAlerts, domainMismatchAlerts],
  );
}

function useTransactionAlerts(): Alert[] {
  const accountNoFundsAlerts = useAccountNoFundsAlert();
  const accountTypeUpgradeAlerts = useAccountTypeUpgrade();
  const addressPoisoningAlert = useAddressPoisoningAlert();
  const burnAddressAlert = useBurnAddressAlert();
  const depositLimitAlerts = useTransactionDepositLimitAlert();
  const firstTimeInteractionAlert = useFirstTimeInteractionAlert();
  const gasEstimateFailedAlerts = useGasEstimateFailedAlerts();
  const gasFeeLowAlerts = useGasFeeLowAlerts();
  const gasSponsorshipWarningAlerts = useGasSponsorshipWarningAlerts();
  const gasTooLowAlerts = useGasTooLowAlerts();
  const insufficientBalanceAlerts = useInsufficientBalanceAlerts();
  const insufficientPayTokenBalanceAlerts =
    useInsufficientPayTokenBalanceAlert();
  const insufficientMoneyAccountBalanceAlerts =
    useInsufficientMoneyAccountBalanceAlert();
  const perpsWithdrawInsufficientBalanceAlerts =
    usePerpsWithdrawInsufficientBalanceAlert();
  const multipleApprovalAlerts = useMultipleApprovalsAlerts();
  const noGasPriceAlerts = useNoGasPriceAlerts();
  const noPayTokenQuotesAlerts = useNoPayTokenQuotesAlert();
  const nonContractAddressAlerts = useNonContractAddressAlerts();
  const pendingTransactionAlerts = usePendingTransactionAlerts();
  const payHardwareAccountAlerts = usePayHardwareAccountAlert();
  const shieldCoverageAlert = useShieldCoverageAlert();
  const signingOrSubmittingAlerts = useSigningOrSubmittingAlerts();
  const suggestedGasFeeHighAlert = useSuggestedGasFeeHighAlert();
  const tokenContractAlert = useTokenContractAlert();
  const tokenTrustSignalAlerts = useTokenTrustSignalAlerts();

  return useMemo(
    () => [
      ...accountNoFundsAlerts,
      ...accountTypeUpgradeAlerts,
      ...addressPoisoningAlert,
      ...burnAddressAlert,
      ...depositLimitAlerts,
      ...firstTimeInteractionAlert,
      ...gasEstimateFailedAlerts,
      ...gasFeeLowAlerts,
      ...gasSponsorshipWarningAlerts,
      ...gasTooLowAlerts,
      ...insufficientBalanceAlerts,
      ...insufficientPayTokenBalanceAlerts,
      ...insufficientMoneyAccountBalanceAlerts,
      ...perpsWithdrawInsufficientBalanceAlerts,
      ...multipleApprovalAlerts,
      ...noGasPriceAlerts,
      ...noPayTokenQuotesAlerts,
      ...nonContractAddressAlerts,
      ...pendingTransactionAlerts,
      ...payHardwareAccountAlerts,
      ...shieldCoverageAlert,
      ...signingOrSubmittingAlerts,
      ...suggestedGasFeeHighAlert,
      ...tokenContractAlert,
      ...tokenTrustSignalAlerts,
    ],
    [
      accountNoFundsAlerts,
      accountTypeUpgradeAlerts,
      addressPoisoningAlert,
      burnAddressAlert,
      depositLimitAlerts,
      firstTimeInteractionAlert,
      gasEstimateFailedAlerts,
      gasFeeLowAlerts,
      gasSponsorshipWarningAlerts,
      gasTooLowAlerts,
      insufficientBalanceAlerts,
      insufficientPayTokenBalanceAlerts,
      insufficientMoneyAccountBalanceAlerts,
      perpsWithdrawInsufficientBalanceAlerts,
      multipleApprovalAlerts,
      noGasPriceAlerts,
      noPayTokenQuotesAlerts,
      nonContractAddressAlerts,
      pendingTransactionAlerts,
      payHardwareAccountAlerts,
      shieldCoverageAlert,
      signingOrSubmittingAlerts,
      suggestedGasFeeHighAlert,
      tokenContractAlert,
      tokenTrustSignalAlerts,
    ],
  );
}

/**
 * MM Pay confirmations surface blocking issues as inline text (via
 * `useTransactionCustomAmountAlerts`), so key-value row icons are redundant.
 * @param alerts
 */
function withoutRowFields(alerts: Alert[]): Alert[] {
  return alerts.map(({ field: _field, ...alert }) => alert);
}

export default function useConfirmationAlerts(): Alert[] {
  const { currentConfirmation } = useConfirmContext();
  const blockaidAlerts = useBlockaidAlerts();
  const confirmationOriginAlerts = useConfirmationOriginAlerts();
  const signatureAlerts = useSignatureAlerts();
  const transactionAlerts = useTransactionAlerts();
  const selectedAccountAlerts = useSelectedAccountAlerts();
  const networkAndOriginSwitchingAlerts = useNetworkAndOriginSwitchingAlerts();
  const addressTrustSignalAlerts = useAddressTrustSignalAlerts();
  const originTrustSignalAlerts = useOriginTrustSignalAlerts();
  const spenderAlerts = useSpenderAlerts();
  const addEthereumChainAlerts = useAddEthereumChainAlerts();

  const isPayTransaction = hasTransactionType(
    currentConfirmation as TransactionMeta | undefined,
    PAY_TRANSACTION_TYPES,
  );

  return useMemo(() => {
    const alerts = [
      ...blockaidAlerts,
      ...confirmationOriginAlerts,
      ...signatureAlerts,
      ...transactionAlerts,
      ...selectedAccountAlerts,
      ...networkAndOriginSwitchingAlerts,
      ...addressTrustSignalAlerts,
      ...originTrustSignalAlerts,
      ...spenderAlerts,
      ...addEthereumChainAlerts,
    ];

    return isPayTransaction ? withoutRowFields(alerts) : alerts;
  }, [
    addEthereumChainAlerts,
    addressTrustSignalAlerts,
    blockaidAlerts,
    confirmationOriginAlerts,
    isPayTransaction,
    networkAndOriginSwitchingAlerts,
    originTrustSignalAlerts,
    selectedAccountAlerts,
    signatureAlerts,
    spenderAlerts,
    transactionAlerts,
  ]);
}
