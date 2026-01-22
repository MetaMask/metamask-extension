import { useMemo } from 'react';
import { Alert } from '../../../ducks/confirm-alerts/confirm-alerts';
import useAccountMismatchAlerts from './alerts/signatures/useAccountMismatchAlerts';
import useDomainMismatchAlerts from './alerts/signatures/useDomainMismatchAlerts';
import { useAccountTypeUpgrade } from './alerts/transactions/useAccountTypeUpgrade';
import { useFirstTimeInteractionAlert } from './alerts/transactions/useFirstTimeInteractionAlert';
import { useGasEstimateFailedAlerts } from './alerts/transactions/useGasEstimateFailedAlerts';
import { useGasFeeLowAlerts } from './alerts/transactions/useGasFeeLowAlerts';
import { useGasTooLowAlerts } from './alerts/transactions/useGasTooLowAlerts';
import { useInsufficientBalanceAlerts } from './alerts/transactions/useInsufficientBalanceAlerts';
import { useInsufficientPayTokenBalanceAlert } from './alerts/transactions/useInsufficientPayTokenBalanceAlert';
import { useMultipleApprovalsAlerts } from './alerts/transactions/useMultipleApprovalsAlerts';
import { useNoGasPriceAlerts } from './alerts/transactions/useNoGasPriceAlerts';
import { useNoPayTokenQuotesAlert } from './alerts/transactions/useNoPayTokenQuotesAlert';
import { useNonContractAddressAlerts } from './alerts/transactions/useNonContractAddressAlerts';
import { usePendingTransactionAlerts } from './alerts/transactions/usePendingTransactionAlerts';
import { usePayHardwareAccountAlert } from './alerts/transactions/usePayHardwareAccountAlert';
import { useResimulationAlert } from './alerts/transactions/useResimulationAlert';
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

function useSignatureAlerts(): Alert[] {
  const accountMismatchAlerts = useAccountMismatchAlerts();
  const domainMismatchAlerts = useDomainMismatchAlerts();

  return useMemo(
    () => [...accountMismatchAlerts, ...domainMismatchAlerts],
    [accountMismatchAlerts, domainMismatchAlerts],
  );
}

function useTransactionAlerts(): Alert[] {
  const accountTypeUpgradeAlerts = useAccountTypeUpgrade();
  const burnAddressAlert = useBurnAddressAlert();
  const firstTimeInteractionAlert = useFirstTimeInteractionAlert();
  const gasEstimateFailedAlerts = useGasEstimateFailedAlerts();
  const gasFeeLowAlerts = useGasFeeLowAlerts();
  const gasTooLowAlerts = useGasTooLowAlerts();
  const insufficientBalanceAlerts = useInsufficientBalanceAlerts();
  const insufficientPayTokenBalanceAlerts =
    useInsufficientPayTokenBalanceAlert();
  const multipleApprovalAlerts = useMultipleApprovalsAlerts();
  const noGasPriceAlerts = useNoGasPriceAlerts();
  const noPayTokenQuotesAlerts = useNoPayTokenQuotesAlert();
  const nonContractAddressAlerts = useNonContractAddressAlerts();
  const pendingTransactionAlerts = usePendingTransactionAlerts();
  const payHardwareAccountAlerts = usePayHardwareAccountAlert();
  const resimulationAlert = useResimulationAlert();
  const shieldCoverageAlert = useShieldCoverageAlert();
  const signingOrSubmittingAlerts = useSigningOrSubmittingAlerts();
  const tokenTrustSignalAlerts = useTokenTrustSignalAlerts();

  return useMemo(
    () => [
      ...accountTypeUpgradeAlerts,
      ...burnAddressAlert,
      ...firstTimeInteractionAlert,
      ...gasEstimateFailedAlerts,
      ...gasFeeLowAlerts,
      ...gasTooLowAlerts,
      ...insufficientBalanceAlerts,
      ...insufficientPayTokenBalanceAlerts,
      ...multipleApprovalAlerts,
      ...noGasPriceAlerts,
      ...noPayTokenQuotesAlerts,
      ...nonContractAddressAlerts,
      ...pendingTransactionAlerts,
      ...payHardwareAccountAlerts,
      ...resimulationAlert,
      ...shieldCoverageAlert,
      ...signingOrSubmittingAlerts,
      ...tokenTrustSignalAlerts,
    ],
    [
      accountTypeUpgradeAlerts,
      burnAddressAlert,
      firstTimeInteractionAlert,
      gasEstimateFailedAlerts,
      gasFeeLowAlerts,
      gasTooLowAlerts,
      insufficientBalanceAlerts,
      insufficientPayTokenBalanceAlerts,
      multipleApprovalAlerts,
      noGasPriceAlerts,
      noPayTokenQuotesAlerts,
      nonContractAddressAlerts,
      pendingTransactionAlerts,
      payHardwareAccountAlerts,
      resimulationAlert,
      shieldCoverageAlert,
      signingOrSubmittingAlerts,
      tokenTrustSignalAlerts,
    ],
  );
}

export default function useConfirmationAlerts(): Alert[] {
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

  return useMemo(
    () => [
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
    ],
    [
      blockaidAlerts,
      confirmationOriginAlerts,
      signatureAlerts,
      transactionAlerts,
      selectedAccountAlerts,
      networkAndOriginSwitchingAlerts,
      addressTrustSignalAlerts,
      originTrustSignalAlerts,
      spenderAlerts,
      addEthereumChainAlerts,
    ],
  );
}
