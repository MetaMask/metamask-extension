import { useSelector } from 'react-redux';
import { TransactionMeta } from '@metamask/transaction-controller';
import { useConfirmContext } from '../../context/confirm';
import { getUseTransactionSimulations } from '../../../../selectors';
import { useHasInsufficientBalance } from '../useHasInsufficientBalance';
import { useIsGaslessSupported } from './useIsGaslessSupported';

export function useIsGaslessLoading() {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const { gasFeeTokens } = transactionMeta ?? {};

  const { isSupported: isGaslessSupported, pending } = useIsGaslessSupported();
  const isSimulationEnabled = useSelector(getUseTransactionSimulations);

  const { hasInsufficientBalance } = useHasInsufficientBalance();

  const isGaslessSupportedFinished = !pending && isGaslessSupported;

  const isGaslessLoading =
    isSimulationEnabled &&
    isGaslessSupportedFinished &&
    hasInsufficientBalance &&
    !gasFeeTokens;

  return { isGaslessLoading };
}
