import { useMemo } from 'react';
import useBlockaidAlerts from './alerts/useBlockaidAlert';
import { useInsufficientBalanceAlerts } from './alerts/transactions/useInsufficientBalanceAlerts';
import { useGasEstimateFailedAlerts } from './alerts/transactions/useGasEstimateFailedAlerts';
import { usePendingTransactionAlerts } from './alerts/transactions/usePendingTransactionAlerts';
import { useGasFeeLowAlerts } from './alerts/transactions/useGasFeeLowAlerts';

const useConfirmationAlerts = () => {
  const blockaidAlerts = useBlockaidAlerts();
  const insufficientBalanceAlerts = useInsufficientBalanceAlerts();
  const gasEstimateFailedAlerts = useGasEstimateFailedAlerts();
  const pendingTransactionAlerts = usePendingTransactionAlerts();
  const gasFeeLowAlerts = useGasFeeLowAlerts();

  return useMemo(
    () => [
      ...blockaidAlerts,
      ...insufficientBalanceAlerts,
      ...gasEstimateFailedAlerts,
      ...pendingTransactionAlerts,
      ...gasFeeLowAlerts,
    ],
    [
      blockaidAlerts,
      insufficientBalanceAlerts,
      gasEstimateFailedAlerts,
      pendingTransactionAlerts,
      gasFeeLowAlerts,
    ],
  );
};

export default useConfirmationAlerts;
