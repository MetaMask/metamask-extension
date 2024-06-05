import { useMemo } from 'react';
import useBlockaidAlerts from './alerts/useBlockaidAlert';
import { useInsufficientBalanceAlerts } from './alerts/transactions/useInsufficientBalanceAlerts';
import { useGasEstimateFailedAlerts } from './alerts/transactions/useGasEstimateFailedAlerts';
import { usePendingTransactionAlerts } from './alerts/transactions/usePendingTransactionAlerts';
import { useGasFeeLowAlerts } from './alerts/transactions/useGasFeeLowAlerts';
import { usePaymasterAlerts } from './alerts/transactions/usePaymasterAlerts';

const useConfirmationAlerts = () => {
  const blockaidAlerts = useBlockaidAlerts();
  const insufficientBalanceAlerts = useInsufficientBalanceAlerts();
  const gasEstimateFailedAlerts = useGasEstimateFailedAlerts();
  const pendingTransactionAlerts = usePendingTransactionAlerts();
  const gasFeeLowAlerts = useGasFeeLowAlerts();
  const usingPaymasterAlerts = usePaymasterAlerts();

  return useMemo(
    () => [
      ...blockaidAlerts,
      ...insufficientBalanceAlerts,
      ...gasEstimateFailedAlerts,
      ...pendingTransactionAlerts,
      ...gasFeeLowAlerts,
      ...usingPaymasterAlerts,
    ],
    [
      blockaidAlerts,
      insufficientBalanceAlerts,
      gasEstimateFailedAlerts,
      pendingTransactionAlerts,
      gasFeeLowAlerts,
      usingPaymasterAlerts,
    ],
  );
};

export default useConfirmationAlerts;
