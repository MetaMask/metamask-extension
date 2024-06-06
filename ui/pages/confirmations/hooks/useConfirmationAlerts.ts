import { useMemo } from 'react';
import { Alert } from '../../../ducks/confirm-alerts/confirm-alerts';
import useBlockaidAlerts from './alerts/useBlockaidAlert';
import { useInsufficientBalanceAlerts } from './alerts/transactions/useInsufficientBalanceAlerts';
import { useGasEstimateFailedAlerts } from './alerts/transactions/useGasEstimateFailedAlerts';
import { usePendingTransactionAlerts } from './alerts/transactions/usePendingTransactionAlerts';
import { useGasFeeLowAlerts } from './alerts/transactions/useGasFeeLowAlerts';
import { usePaymasterAlerts } from './alerts/transactions/usePaymasterAlerts';
import { useSigningOrSubmittingAlerts } from './alerts/transactions/useSigningOrSubmittingAlerts';
import { useGasTooLowAlerts } from './alerts/transactions/useGasTooLowAlerts';
import { useNoGasPriceAlerts } from './alerts/transactions/useNoGasPriceAlerts';

function useTransactionAlerts(): Alert[] {
  const gasEstimateFailedAlerts = useGasEstimateFailedAlerts();
  const gasFeeLowAlerts = useGasFeeLowAlerts();
  const gasTooLowAlerts = useGasTooLowAlerts();
  const insufficientBalanceAlerts = useInsufficientBalanceAlerts();
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
