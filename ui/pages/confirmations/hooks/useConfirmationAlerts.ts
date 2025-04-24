import { useMemo } from 'react';
import { Alert } from '../../../ducks/confirm-alerts/confirm-alerts';
import useAccountMismatchAlerts from './alerts/signatures/useAccountMismatchAlerts';
import useDomainMismatchAlerts from './alerts/signatures/useDomainMismatchAlerts';
import { useGasEstimateFailedAlerts } from './alerts/transactions/useGasEstimateFailedAlerts';
import { useGasFeeLowAlerts } from './alerts/transactions/useGasFeeLowAlerts';
import { useGasTooLowAlerts } from './alerts/transactions/useGasTooLowAlerts';
import { useInsufficientBalanceAlerts } from './alerts/transactions/useInsufficientBalanceAlerts';
import { useNetworkBusyAlerts } from './alerts/transactions/useNetworkBusyAlerts';
import { useNoGasPriceAlerts } from './alerts/transactions/useNoGasPriceAlerts';
import { usePendingTransactionAlerts } from './alerts/transactions/usePendingTransactionAlerts';
import { useResimulationAlert } from './alerts/transactions/useResimulationAlert';
import { useFirstTimeInteractionAlert } from './alerts/transactions/useFirstTimeInteractionAlert';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import { useSigningOrSubmittingAlerts } from './alerts/transactions/useSigningOrSubmittingAlerts';
///: END:ONLY_INCLUDE_IF
import useConfirmationOriginAlerts from './alerts/useConfirmationOriginAlerts';
import useBlockaidAlerts from './alerts/useBlockaidAlerts';
import { useNetworkAndOriginSwitchingAlerts } from './alerts/useNetworkAndOriginSwitchingAlerts';
import { useSelectedAccountAlerts } from './alerts/useSelectedAccountAlerts';
import { useNonContractAddressAlerts } from './alerts/transactions/useNonContractAddressAlerts';
import { useAccountTypeUpgrade } from './alerts/transactions/useAccountTypeUpgrade';

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
  const gasEstimateFailedAlerts = useGasEstimateFailedAlerts();
  const gasFeeLowAlerts = useGasFeeLowAlerts();
  const gasTooLowAlerts = useGasTooLowAlerts();
  const insufficientBalanceAlerts = useInsufficientBalanceAlerts();
  const networkBusyAlerts = useNetworkBusyAlerts();
  const noGasPriceAlerts = useNoGasPriceAlerts();
  const pendingTransactionAlerts = usePendingTransactionAlerts();
  const resimulationAlert = useResimulationAlert();
  const firstTimeInteractionAlert = useFirstTimeInteractionAlert();
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  const signingOrSubmittingAlerts = useSigningOrSubmittingAlerts();
  ///: END:ONLY_INCLUDE_IF
  const nonContractAddressAlerts = useNonContractAddressAlerts();

  return useMemo(
    () => [
      ...accountTypeUpgradeAlerts,
      ...gasEstimateFailedAlerts,
      ...gasFeeLowAlerts,
      ...gasTooLowAlerts,
      ...insufficientBalanceAlerts,
      ...networkBusyAlerts,
      ...noGasPriceAlerts,
      ...pendingTransactionAlerts,
      ...resimulationAlert,
      ...firstTimeInteractionAlert,
      ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
      ...signingOrSubmittingAlerts,
      ///: END:ONLY_INCLUDE_IF
      ...nonContractAddressAlerts,
    ],
    [
      accountTypeUpgradeAlerts,
      gasEstimateFailedAlerts,
      gasFeeLowAlerts,
      gasTooLowAlerts,
      insufficientBalanceAlerts,
      networkBusyAlerts,
      noGasPriceAlerts,
      pendingTransactionAlerts,
      resimulationAlert,
      firstTimeInteractionAlert,
      ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
      signingOrSubmittingAlerts,
      ///: END:ONLY_INCLUDE_IF
      nonContractAddressAlerts,
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
