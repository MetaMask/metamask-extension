import { useMemo } from 'react';
import { Alert } from '../../../ducks/confirm-alerts/confirm-alerts';
import useBlockaidAlerts from './alerts/useBlockaidAlerts';
import useDomainMismatchAlerts from './alerts/signatures/useDomainMismatchAlerts';
import { useInsufficientBalanceAlerts } from './alerts/transactions/useInsufficientBalanceAlerts';
import { useGasEstimateFailedAlerts } from './alerts/transactions/useGasEstimateFailedAlerts';
import { usePendingTransactionAlerts } from './alerts/transactions/usePendingTransactionAlerts';
import { useGasFeeLowAlerts } from './alerts/transactions/useGasFeeLowAlerts';
import { useSigningOrSubmittingAlerts } from './alerts/transactions/useSigningOrSubmittingAlerts';
import { useGasTooLowAlerts } from './alerts/transactions/useGasTooLowAlerts';
import { useNoGasPriceAlerts } from './alerts/transactions/useNoGasPriceAlerts';
import { useNetworkBusyAlerts } from './alerts/transactions/useNetworkBusyAlerts';

function useSignatureAlerts(): Alert[] {
  const domainMismatchAlerts = useDomainMismatchAlerts();

  return useMemo(() => [...domainMismatchAlerts], [domainMismatchAlerts]);
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
    ],
  );
}

export default function useConfirmationAlerts(): Alert[] {
  const blockaidAlerts = useBlockaidAlerts();
  const signatureAlerts = useSignatureAlerts();
  const transactionAlerts = useTransactionAlerts();

  return useMemo(
    () => [...blockaidAlerts, ...signatureAlerts, ...transactionAlerts],
    [blockaidAlerts, signatureAlerts, transactionAlerts],
  );
}
