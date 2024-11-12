import { useSelector } from 'react-redux';
import { UseSimulationMetricsProps, useSimulationMetrics } from '../components/simulation-details/useSimulationMetrics';
import { selectUseTransactionSimulations } from '../selectors/preferences';

/**
 * This hook is to capture simulation metrics in the case where the simulation UI is not visible
 * e.g. when a send transaction is initiated through the wallet itself.
 * (only exception is if the user had disabled it themselves).
 */
export function useSimulationMetricsNoShow({
  enableMetrics,
  transactionId,
}: { enableMetrics: boolean, transactionId: string }) {
  const useTransactionSimulations = useSelector(
    selectUseTransactionSimulations,
  );

  useSimulationMetrics({
    enableMetrics: useTransactionSimulations && enableMetrics,
    balanceChanges: [],
    loading: false,
    simulationData: { tokenBalanceChanges: [] },
    transactionId,
  } as UseSimulationMetricsProps);
}
