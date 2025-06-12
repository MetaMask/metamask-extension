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
import { useMultipleApprovalsAlerts } from './alerts/transactions/useMultipleApprovalsAlerts';
import { useNetworkBusyAlerts } from './alerts/transactions/useNetworkBusyAlerts';
import { useNoGasPriceAlerts } from './alerts/transactions/useNoGasPriceAlerts';
import { useNonContractAddressAlerts } from './alerts/transactions/useNonContractAddressAlerts';
import { usePendingTransactionAlerts } from './alerts/transactions/usePendingTransactionAlerts';
import { useResimulationAlert } from './alerts/transactions/useResimulationAlert';
import { useSigningOrSubmittingAlerts } from './alerts/transactions/useSigningOrSubmittingAlerts';
import useBlockaidAlerts from './alerts/useBlockaidAlerts';
import useConfirmationOriginAlerts from './alerts/useConfirmationOriginAlerts';
import { useNetworkAndOriginSwitchingAlerts } from './alerts/useNetworkAndOriginSwitchingAlerts';
import { useSelectedAccountAlerts } from './alerts/useSelectedAccountAlerts';

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
  const firstTimeInteractionAlert = useFirstTimeInteractionAlert();
  const gasEstimateFailedAlerts = useGasEstimateFailedAlerts();
  const gasFeeLowAlerts = useGasFeeLowAlerts();
  const gasTooLowAlerts = useGasTooLowAlerts();
  const insufficientBalanceAlerts = useInsufficientBalanceAlerts();
  const multipleApprovalAlerts = useMultipleApprovalsAlerts();
  const networkBusyAlerts = useNetworkBusyAlerts();
  const noGasPriceAlerts = useNoGasPriceAlerts();
  const nonContractAddressAlerts = useNonContractAddressAlerts();
  const pendingTransactionAlerts = usePendingTransactionAlerts();
  const resimulationAlert = useResimulationAlert();
  const signingOrSubmittingAlerts = useSigningOrSubmittingAlerts();

  return useMemo(
    () => [
      ...accountTypeUpgradeAlerts,
      ...firstTimeInteractionAlert,
      ...gasEstimateFailedAlerts,
      ...gasFeeLowAlerts,
      ...gasTooLowAlerts,
      ...insufficientBalanceAlerts,
      ...multipleApprovalAlerts,
      ...networkBusyAlerts,
      ...noGasPriceAlerts,
      ...nonContractAddressAlerts,
      ...pendingTransactionAlerts,
      ...resimulationAlert,
      ...signingOrSubmittingAlerts,
    ],
    [
      accountTypeUpgradeAlerts,
      firstTimeInteractionAlert,
      gasEstimateFailedAlerts,
      gasFeeLowAlerts,
      gasTooLowAlerts,
      insufficientBalanceAlerts,
      multipleApprovalAlerts,
      networkBusyAlerts,
      noGasPriceAlerts,
      nonContractAddressAlerts,
      pendingTransactionAlerts,
      resimulationAlert,
      signingOrSubmittingAlerts,
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

  return useMemo(
    () => [
      ...blockaidAlerts,
      ...confirmationOriginAlerts,
      ...signatureAlerts,
      ...transactionAlerts,
      ...selectedAccountAlerts,
      ...networkAndOriginSwitchingAlerts,
    ],
    [
      blockaidAlerts,
      confirmationOriginAlerts,
      signatureAlerts,
      transactionAlerts,
      selectedAccountAlerts,
      networkAndOriginSwitchingAlerts,
    ],
  );
}
