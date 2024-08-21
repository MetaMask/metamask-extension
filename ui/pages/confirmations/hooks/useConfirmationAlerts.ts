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
import { useQueuedConfirmationsAlerts } from './alerts/transactions/useQueuedConfirmationsAlerts';
import { useSigningOrSubmittingAlerts } from './alerts/transactions/useSigningOrSubmittingAlerts';
import useConfirmationOriginAlerts from './alerts/useConfirmationOriginAlerts';
import useBlockaidAlerts from './alerts/useBlockaidAlerts';

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
  const signingOrSubmittingAlerts = useSigningOrSubmittingAlerts();
  const queuedConfirmationsAlerts = useQueuedConfirmationsAlerts();

  return useMemo(
    () => [
      ...gasEstimateFailedAlerts,
      ...gasFeeLowAlerts,
      ...gasTooLowAlerts,
      ...insufficientBalanceAlerts,
      ...networkBusyAlerts,
      ...noGasPriceAlerts,
      ...pendingTransactionAlerts,
      ...signingOrSubmittingAlerts,
      ...queuedConfirmationsAlerts,
    ],
    [
      gasEstimateFailedAlerts,
      gasFeeLowAlerts,
      gasTooLowAlerts,
      insufficientBalanceAlerts,
      networkBusyAlerts,
      noGasPriceAlerts,
      pendingTransactionAlerts,
      signingOrSubmittingAlerts,
      queuedConfirmationsAlerts,
    ],
  );
}

export default function useConfirmationAlerts(): Alert[] {
  const blockaidAlerts = useBlockaidAlerts();
  const confirmationOriginAlerts = useConfirmationOriginAlerts();
  const signatureAlerts = useSignatureAlerts();
  const transactionAlerts = useTransactionAlerts();

  return useMemo(
    () => [
      ...blockaidAlerts,
      ...confirmationOriginAlerts,
      ...signatureAlerts,
      ...transactionAlerts,
    ],
    [
      blockaidAlerts,
      confirmationOriginAlerts,
      signatureAlerts,
      transactionAlerts,
    ],
  );
}
