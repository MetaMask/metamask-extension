import { useIsNetworkGasSponsored } from '../../../../../hooks/useIsNetworkGasSponsored';
import { useIsGaslessSupported } from '../../gas/useIsGaslessSupported';
import { useTransactionMetadataRequest } from '../../transactions/useTransactionMetadataRequest';

/**
 * Determines if current transaction is gas sponsored based on:
 * - Is Sponsorship enabled throught feature flags for this network.
 * - Is Gasless feature enabled for current transaction and connected wallet (not HW).
 */
export const useIsCurrentTransactionGasSponsored = (): {
  isCurrentTransactionGasSponsored: boolean;
} => {
  const transactionMeta = useTransactionMetadataRequest();
  const { isSupported: isGaslessSupported } = useIsGaslessSupported();
  const { isNetworkGasSponsored } = useIsNetworkGasSponsored(
    transactionMeta?.chainId,
  );

  const isCurrentTransactionGasSponsored =
    isGaslessSupported && isNetworkGasSponsored;

  return {
    isCurrentTransactionGasSponsored,
  };
};
