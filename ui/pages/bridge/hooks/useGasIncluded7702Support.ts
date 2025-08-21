import { useEffect, useState } from 'react';
import { Hex } from '@metamask/utils';
import { isRelaySupported } from '../../../store/actions';
import { isAtomicBatchSupported } from '../../../store/controller-actions/transaction-controller';

type Chain = {
  chainId: string;
};

type Account = {
  address: string;
};

/**
 * Custom hook to check if gasless 7702 is supported for Smart Accounts
 *
 * @param smartAccountOptIn - Whether smart account is opted in
 * @param isSwap - Whether this is a swap transaction
 * @param selectedAccount - The selected account
 * @param fromChain - The source chain
 * @returns Whether gasless 7702 is supported
 */
export function useGasIncluded7702Support(
  smartAccountOptIn: boolean,
  isSwap: boolean,
  selectedAccount: Account | null | undefined,
  fromChain: Chain | null | undefined,
): boolean {
  const [isGasIncluded7702Supported, setIsGasIncluded7702Supported] =
    useState(false);

  useEffect(() => {
    const checkGasIncluded7702Support = async () => {
      if (
        !smartAccountOptIn ||
        !isSwap ||
        !selectedAccount?.address ||
        !fromChain?.chainId
      ) {
        setIsGasIncluded7702Supported(false);
        return;
      }

      try {
        // Check if atomic batch is supported for the account
        const atomicBatchResult = await isAtomicBatchSupported({
          address: selectedAccount.address as Hex,
          chainIds: [fromChain.chainId as Hex],
        });

        const atomicBatchChainSupport = atomicBatchResult?.find(
          (result) =>
            result.chainId.toLowerCase() === fromChain.chainId.toLowerCase(),
        );

        // Check if relay is supported for the chain
        const relaySupportsChain = await isRelaySupported(
          fromChain.chainId as Hex,
        );

        // 7702 is supported if both atomic batch and relay are supported
        const is7702Supported = Boolean(
          atomicBatchChainSupport?.isSupported && relaySupportsChain,
        );

        setIsGasIncluded7702Supported(is7702Supported);
      } catch (error) {
        console.error('Error checking gasless 7702 support:', error);
        setIsGasIncluded7702Supported(false);
      }
    };

    checkGasIncluded7702Support();
  }, [smartAccountOptIn, isSwap, selectedAccount?.address, fromChain?.chainId]);

  return isGasIncluded7702Supported;
}
