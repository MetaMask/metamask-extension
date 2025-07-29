import { useSelector } from 'react-redux';
import { TransactionMeta } from '@metamask/transaction-controller';
import { useConfirmContext } from '../../context/confirm';
import { getUseTransactionSimulations } from '../../../../selectors';
import { useIsInsufficientBalance } from '../useIsInsufficientBalance';
import { useIsGaslessSupported } from './useIsGaslessSupported';

export function useIsGaslessLoading() {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

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
