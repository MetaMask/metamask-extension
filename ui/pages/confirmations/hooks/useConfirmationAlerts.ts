import { useMemo } from 'react';

import type { Alert } from '../../../ducks/confirm-alerts/confirm-alerts';
import useAccountMismatchAlerts from './alerts/signatures/useAccountMismatchAlerts';
import useDomainMismatchAlerts from './alerts/signatures/useDomainMismatchAlerts';
import { useFirstTimeInteractionAlert } from './alerts/transactions/useFirstTimeInteractionAlert';
import { useGasEstimateFailedAlerts } from './alerts/transactions/useGasEstimateFailedAlerts';
import { useGasFeeLowAlerts } from './alerts/transactions/useGasFeeLowAlerts';
import { useGasTooLowAlerts } from './alerts/transactions/useGasTooLowAlerts';
import { useInsufficientBalanceAlerts } from './alerts/transactions/useInsufficientBalanceAlerts';
import { useNetworkBusyAlerts } from './alerts/transactions/useNetworkBusyAlerts';
import { useNoGasPriceAlerts } from './alerts/transactions/useNoGasPriceAlerts';
import { useNonContractAddressAlerts } from './alerts/transactions/useNonContractAddressAlerts';
import { usePendingTransactionAlerts } from './alerts/transactions/usePendingTransactionAlerts';
import { useQueuedConfirmationsAlerts } from './alerts/transactions/useQueuedConfirmationsAlerts';
import { useResimulationAlert } from './alerts/transactions/useResimulationAlert';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import { useSigningOrSubmittingAlerts } from './alerts/transactions/useSigningOrSubmittingAlerts';
///: END:ONLY_INCLUDE_IF
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
  const queuedConfirmationsAlerts = useQueuedConfirmationsAlerts();
  const nonContractAddressAlerts = useNonContractAddressAlerts();

  return useMemo(
    () => [
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
      ...queuedConfirmationsAlerts,
      ...nonContractAddressAlerts,
    ],
    [
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
      queuedConfirmationsAlerts,
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
