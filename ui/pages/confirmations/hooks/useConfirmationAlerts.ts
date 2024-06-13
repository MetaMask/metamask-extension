import { useMemo } from 'react';
import { Alert } from '../../../ducks/confirm-alerts/confirm-alerts';
import useBlockaidAlerts from './alerts/useBlockaidAlerts';
import { useInsufficientBalanceAlerts } from './alerts/transactions/useInsufficientBalanceAlerts';
import { useGasEstimateFailedAlerts } from './alerts/transactions/useGasEstimateFailedAlerts';
import { usePendingTransactionAlerts } from './alerts/transactions/usePendingTransactionAlerts';
import { useGasFeeLowAlerts } from './alerts/transactions/useGasFeeLowAlerts';
import { usePaymasterAlerts } from './alerts/transactions/usePaymasterAlerts';
import { useSigningOrSubmittingAlerts } from './alerts/transactions/useSigningOrSubmittingAlerts';
import { useGasTooLowAlerts } from './alerts/transactions/useGasTooLowAlerts';
import { useNoGasPriceAlerts } from './alerts/transactions/useNoGasPriceAlerts';
import { useNetworkBusyAlerts } from './alerts/transactions/useNetworkBusyAlerts';

function useTransactionAlerts(): Alert[] {
  const gasEstimateFailedAlerts = useGasEstimateFailedAlerts();
  const gasFeeLowAlerts = useGasFeeLowAlerts();
  const gasTooLowAlerts = useGasTooLowAlerts();
  const insufficientBalanceAlerts = useInsufficientBalanceAlerts();
  const networkBusyAlerts = useNetworkBusyAlerts();
  const noGasPriceAlerts = useNoGasPriceAlerts();
  const pendingTransactionAlerts = usePendingTransactionAlerts();
  const signingOrSubmittingAlerts = useSigningOrSubmittingAlerts();
  const usingPaymasterAlerts = usePaymasterAlerts();

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
      ...usingPaymasterAlerts,
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
      usingPaymasterAlerts,
    ],
  );
}

export default function useConfirmationAlerts(): Alert[] {
  const blockaidAlerts = useBlockaidAlerts();
  const transactionAlerts = useTransactionAlerts();

  return useMemo(
    () => [...blockaidAlerts, ...transactionAlerts],
    [blockaidAlerts, transactionAlerts],
  );
}
