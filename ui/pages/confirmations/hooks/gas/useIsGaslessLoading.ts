import { useSelector } from 'react-redux';
import { TransactionMeta } from '@metamask/transaction-controller';
import { useConfirmContext } from '../../context/confirm';
import { getUseTransactionSimulations } from '../../../../selectors';
import { useIsInsufficientBalance } from '../useIsInsufficientBalance';
import { useIsGaslessSupported } from './useIsGaslessSupported';

export function useIsGaslessLoading() {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const { simulationData } = transactionMeta ?? {};

  const { isSupported: isGaslessSupported } = useIsGaslessSupported();
  const isSimulationEnabled = useSelector(getUseTransactionSimulations);

  const hasInsufficientNative = useIsInsufficientBalance();

  const canSkipSimulationChecks = !isSimulationEnabled || !isGaslessSupported;

  const isGaslessLoading =
    canSkipSimulationChecks ||
    !hasInsufficientNative ||
    Boolean(simulationData);

  return {
    isGaslessLoading,
  };
}
