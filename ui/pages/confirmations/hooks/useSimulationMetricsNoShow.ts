import { useSelector } from 'react-redux';
import { TransactionMeta } from '@metamask/transaction-controller';
import {
  UseSimulationMetricsProps,
  useSimulationMetrics,
} from '../components/simulation-details/useSimulationMetrics';
import { selectUseTransactionSimulations } from '../selectors/preferences';
import { useBalanceChanges } from '../components/simulation-details/useBalanceChanges';

/**
 * This hook is to capture simulation metrics in the case where the simulation UI is not visible
 * e.g. when a send transaction is initiated through the wallet itself.
 * (only exception is if the user had disabled it themselves).
 *
 * @param options
 * @param options.enableMetrics
 * @param options.transactionMeta
 */
export function useSimulationMetricsNoShow({
  enableMetrics,
  transactionMeta,
}: {
  enableMetrics: boolean;
  transactionMeta: TransactionMeta;
}) {
  const { chainId, id: transactionId, simulationData } = transactionMeta;
  const balanceChangesResult = useBalanceChanges({ chainId, simulationData });
  const useTransactionSimulations = useSelector(
    selectUseTransactionSimulations,
  );
  const loading = !simulationData || balanceChangesResult.pending;

  useSimulationMetrics({
    enableMetrics: useTransactionSimulations && enableMetrics,
    balanceChanges: balanceChangesResult.value,
    loading,
    simulationData,
    transactionId,
  } as UseSimulationMetricsProps);
}
