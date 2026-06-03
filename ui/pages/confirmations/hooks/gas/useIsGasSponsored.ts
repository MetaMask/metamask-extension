import { useIsNetworkGasSponsored } from '../../../../hooks/useIsNetworkGasSponsored';
import { useTransactionMetadataRequest } from '../transactions/useTransactionMetadataRequest';
import { useIsGaslessSupported } from './useIsGaslessSupported';

/**
 * Determines if current transaction is gas sponsored based on:
 * - Is Sponsorship enabled throught feature flags for this network.
 * - Is Gasless feature enabled for current transaction and connected wallet (not HW).
 */
export const useIsGasSponsored = (): boolean => {
  const transactionMeta = useTransactionMetadataRequest();
  const { isSupported: isGaslessSupported } = useIsGaslessSupported();
  const { isNetworkGasSponsored } = useIsNetworkGasSponsored(
    transactionMeta?.chainId,
  );

  return isGaslessSupported && isNetworkGasSponsored;
};
