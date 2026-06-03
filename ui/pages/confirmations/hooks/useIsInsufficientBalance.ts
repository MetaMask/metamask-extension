import { useInsufficientBalanceAlerts } from './alerts/transactions/useInsufficientBalanceAlerts';

export function useIsInsufficientBalance() {
  return Boolean(
    useInsufficientBalanceAlerts({ ignoreGasFeeToken: true }).length,
  );
}
