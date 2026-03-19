import { useSelector } from 'react-redux';

import { useTransactionMetadataRequest } from '../useTransactionMetadataRequest';
import { getUseTransactionSimulations } from '../../../../selectors';
import { useHasInsufficientBalance } from '../useHasInsufficientBalance';
import { useIsGaslessSupported } from './useIsGaslessSupported';

export function useIsGaslessLoading() {
  const transactionMeta = useTransactionMetadataRequest();

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
