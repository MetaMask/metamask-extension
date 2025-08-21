import { useEffect, useState } from 'react';
import { Hex } from '@metamask/utils';
import { isRelaySupported } from '../../../store/actions';
import { isAtomicBatchSupported } from '../../../store/controller-actions/transaction-controller';

interface Chain {
  chainId: string;
}

interface Account {
  address: string;
}

/**
 * Custom hook to check if gasless 7702 is supported for Smart Accounts
 * @param smartAccountOptIn - Whether smart account is opted in
 * @param isSwap - Whether this is a swap transaction
 * @param selectedAccount - The selected account
 * @param fromChain - The source chain
 * @returns Whether gasless 7702 is supported
 */
export function useGasless7702Support(
  smartAccountOptIn: boolean,
  isSwap: boolean,
  selectedAccount: Account | null | undefined,
  fromChain: Chain | null | undefined,
): boolean {
  const [isGasless7702Supported, setIsGasless7702Supported] = useState(false);

  useEffect(() => {
    const checkGasless7702Support = async () => {
      if (
        !smartAccountOptIn ||
        !isSwap ||
        !selectedAccount?.address ||
        !fromChain?.chainId
      ) {
        setIsGasless7702Supported(false);
        return;
      }

      try {
        // Check if atomic batch is supported for the account
        const atomicBatchResult = await isAtomicBatchSupported({
          address: selectedAccount.address as Hex,
          chainIds: [fromChain.chainId],
        });

        const atomicBatchChainSupport = atomicBatchResult?.find(
          (result) =>
            result.chainId.toLowerCase() === fromChain.chainId.toLowerCase(),
        );

        // Check if relay is supported for the chain
        const relaySupportsChain = await isRelaySupported(fromChain.chainId);

        // 7702 is supported if both atomic batch and relay are supported
        const is7702Supported = Boolean(
          atomicBatchChainSupport?.isSupported && relaySupportsChain,
        );

        setIsGasless7702Supported(is7702Supported);
      } catch (error) {
        console.error('Error checking gasless 7702 support:', error);
        setIsGasless7702Supported(false);
      }
    };

    checkGasless7702Support();
  }, [smartAccountOptIn, isSwap, selectedAccount?.address, fromChain?.chainId]);

  return isGasless7702Supported;
}
