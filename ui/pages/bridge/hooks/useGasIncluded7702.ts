import {
  formatChainIdToHex,
  isSolanaChainId,
} from '@metamask/bridge-controller';
import { Hex } from '@metamask/utils';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { getIsSmartTransaction } from '../../../../shared/modules/selectors';
import { isRelaySupported } from '../../../store/actions';
import { isAtomicBatchSupported } from '../../../store/controller-actions/transaction-controller';
import { getUseSmartAccount } from '../../confirmations/selectors/preferences';

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
  isSendBundleSupportedForChain: boolean;
};

/**
 * Custom hook to check if gasless 7702 is supported for Smart Accounts
 *
 * @param params - Configuration object
 * @param params.isSwap - Whether this is a swap transaction
 * @param params.selectedAccount - The selected account
 * @param params.fromChain - The source chain
 * @param params.isSendBundleSupportedForChain - Whether send bundle is supported for the chain
 * @returns Whether gasless 7702 is supported
 */
export function useGasIncluded7702({
  isSwap,
  selectedAccount,
  fromChain,
  isSendBundleSupportedForChain,
}: UseGasIncluded7702Params): boolean {
  const [isGasIncluded7702Supported, setIsGasIncluded7702Supported] =
    useState(false);
  const isSmartTransaction = useSelector((state) =>
    getIsSmartTransaction(state as never, fromChain?.chainId),
  );

  const smartAccountOptedIn = useSelector(getUseSmartAccount);

  useEffect(() => {
    let isCancelled = false;

    const checkGasIncluded7702Support = async () => {
      if (
        (isSendBundleSupportedForChain && isSmartTransaction) ||
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

      if (isSolanaChainId(fromChain.chainId)) {
        setIsGasIncluded7702Supported(false);
        return;
      }

      try {
        const chainIdInHex = formatChainIdToHex(fromChain.chainId);
        const atomicBatchResult = await isAtomicBatchSupported({
          address: selectedAccount.address as Hex,
          chainIds: [chainIdInHex],
        });

        if (isCancelled) {
          return;
        }

        const atomicBatchChainSupport = atomicBatchResult?.find(
          (result) =>
            result.chainId.toLowerCase() === fromChain.chainId.toLowerCase(),
        );

        const relaySupportsChain = await isRelaySupported(chainIdInHex);

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
    fromChain?.chainId,
    isSendBundleSupportedForChain,
    isSmartTransaction,
    isSwap,
    selectedAccount?.address,
  ]);

  return isGasIncluded7702Supported;
}
