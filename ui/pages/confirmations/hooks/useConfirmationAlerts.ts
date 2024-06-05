import { useMemo } from 'react';
import useBlockaidAlerts from './alerts/useBlockaidAlert';
import { useInsufficientBalanceAlerts } from './alerts/transactions/useInsufficientBalanceAlerts';
import { useGasEstimateFailedAlerts } from './alerts/transactions/useGasEstimateFailedAlerts';
import { usePendingTransactionAlerts } from './alerts/transactions/usePendingTransactionAlerts';
import { useGasFeeLowAlerts } from './alerts/transactions/useGasFeeLowAlerts';
import { usePaymasterAlerts } from './alerts/transactions/usePaymasterAlerts';
import { useSigningOrSubmittingAlerts } from './alerts/transactions/useSigningOrSubmittingAlerts';
import { useGasTooLowAlerts } from './alerts/transactions/useGasTooLowAlerts';

const useConfirmationAlerts = () => {
  const blockaidAlerts = useBlockaidAlerts();
  const insufficientBalanceAlerts = useInsufficientBalanceAlerts();
  const gasEstimateFailedAlerts = useGasEstimateFailedAlerts();
  const pendingTransactionAlerts = usePendingTransactionAlerts();
  const gasFeeLowAlerts = useGasFeeLowAlerts();
  const usingPaymasterAlerts = usePaymasterAlerts();
  const signingOrSubmittingAlerts = useSigningOrSubmittingAlerts();
  const gasTooLowAlerts = useGasTooLowAlerts();

  return useMemo(
    () => [
      ...blockaidAlerts,
      ...insufficientBalanceAlerts,
      ...gasEstimateFailedAlerts,
      ...pendingTransactionAlerts,
      ...gasFeeLowAlerts,
      ...usingPaymasterAlerts,
      ...signingOrSubmittingAlerts,
      ...gasTooLowAlerts,
    ],
    [
      blockaidAlerts,
      insufficientBalanceAlerts,
      gasEstimateFailedAlerts,
      pendingTransactionAlerts,
      gasFeeLowAlerts,
      usingPaymasterAlerts,
      signingOrSubmittingAlerts,
      gasTooLowAlerts,
    ],
  );
};

export default useConfirmationAlerts;
