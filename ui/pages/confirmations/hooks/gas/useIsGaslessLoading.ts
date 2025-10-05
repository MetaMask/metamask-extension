import { useSelector } from 'react-redux';
import { getUseTransactionSimulations } from '../../../../selectors';
import { useIsInsufficientBalance } from '../useIsInsufficientBalance';
import { useUnapprovedTransaction } from '../transactions/useUnapprovedTransaction';
import { useIsGaslessSupported } from './useIsGaslessSupported';

export function useIsGaslessLoading() {
  const transactionMeta = useUnapprovedTransaction();
  const { gasFeeTokens } = transactionMeta ?? {};

  const { isSupported: isGaslessSupported } = useIsGaslessSupported();
  const isSimulationEnabled = useSelector(getUseTransactionSimulations);

  const hasInsufficientNative = useIsInsufficientBalance();

  const isGaslessLoading =
    isSimulationEnabled &&
    isGaslessSupported &&
    hasInsufficientNative &&
    !gasFeeTokens;

  return { isGaslessLoading };
}
