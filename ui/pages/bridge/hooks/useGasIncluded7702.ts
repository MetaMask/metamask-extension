import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';
import { isRelaySupported } from '../../../store/actions';
import { isAtomicBatchSupported } from '../../../store/controller-actions/transaction-controller';
import { getUseSmartAccount } from '../../confirmations/selectors/preferences';
import { useIsSendBundleSupported } from './useIsSendBundleSupported';

type Chain = {
  chainId: string;
};

type Account = {
  address: string;
};

type UseGasIncluded7702Params = {
  isSwap: boolean;
  selectedAccount: Account | null | undefined;
  fromChain: Chain | null | undefined;
};

/**
 * Custom hook to check if gasless 7702 is supported for Smart Accounts
 *
 * @param params - Configuration object
 * @param params.isSwap - Whether this is a swap transaction
 * @param params.selectedAccount - The selected account
 * @param params.fromChain - The source chain
 * @returns Whether gasless 7702 is supported
 */
export function useGasIncluded7702({
  isSwap,
  selectedAccount,
  fromChain,
}: UseGasIncluded7702Params): boolean {
  const [isGasIncluded7702Supported, setIsGasIncluded7702Supported] =
    useState(false);

  const smartAccountOptedIn = useSelector(getUseSmartAccount);
  const isSendBundleSupportedForChain = useIsSendBundleSupported(fromChain);

  useEffect(() => {
    let isCancelled = false;

    const checkGasIncluded7702Support = async () => {
      if (
        isSendBundleSupportedForChain ||
        !smartAccountOptedIn ||
        !isSwap ||
        !selectedAccount?.address ||
        !fromChain?.chainId
      ) {
        if (!isCancelled) {
          setIsGasIncluded7702Supported(false);
        }
        return;
      }

      try {
        const atomicBatchResult = await isAtomicBatchSupported({
          address: selectedAccount.address as Hex,
          chainIds: [fromChain.chainId as Hex],
        });

        if (isCancelled) {
          return;
        }

        const atomicBatchChainSupport = atomicBatchResult?.find(
          (result) =>
            result.chainId.toLowerCase() === fromChain.chainId.toLowerCase(),
        );

        const relaySupportsChain = await isRelaySupported(
          fromChain.chainId as Hex,
        );

        const is7702Supported = Boolean(
          atomicBatchChainSupport?.isSupported && relaySupportsChain,
        );

        if (!isCancelled) {
          setIsGasIncluded7702Supported(is7702Supported);
        }
      } catch (error) {
        if (!isCancelled) {
          console.error('Error checking gasless 7702 support:', error);
          setIsGasIncluded7702Supported(false);
        }
      }
    };

    checkGasIncluded7702Support();

    return () => {
      isCancelled = true;
    };
  }, [
    smartAccountOptedIn,
    isSwap,
    selectedAccount?.address,
    fromChain?.chainId,
    isSendBundleSupportedForChain,
  ]);

  return isGasIncluded7702Supported;
}
