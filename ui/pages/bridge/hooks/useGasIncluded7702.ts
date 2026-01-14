import {
  formatChainIdToHex,
  isNonEvmChainId,
} from '@metamask/bridge-controller';
import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { getIsSmartTransaction } from '../../../../shared/modules/selectors';
import { isRelaySupported } from '../../../store/actions';

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

  // Ref to track current isSwap value for async callback guard
  // This prevents state updates when isSwap changes during API call
  const isSwapRef = useRef(isSwap);
  isSwapRef.current = isSwap;

  useEffect(() => {
    let isCancelled = false;

    const checkGasIncluded7702Support = async () => {
      if (
        (isSendBundleSupportedForChain && isSmartTransaction) ||
        !isSwap ||
        !selectedAccount?.address ||
        !fromChain?.chainId
      ) {
        if (!isCancelled) {
          setIsGasIncluded7702Supported(false);
        }
        return;
      }

      if (isNonEvmChainId(fromChain.chainId)) {
        setIsGasIncluded7702Supported(false);
        return;
      }

      try {
        const chainIdInHex = formatChainIdToHex(fromChain.chainId);
        const is7702Supported = await isRelaySupported(chainIdInHex);

        // Guard: only update state if isSwap is still true
        // This prevents stale API results from updating state when
        // isSwap has changed (e.g., user switched from swap to bridge)
        if (!isCancelled && isSwapRef.current) {
          setIsGasIncluded7702Supported(is7702Supported);
        }
      } catch (error) {
        if (!isCancelled && isSwapRef.current) {
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
    fromChain?.chainId,
    isSendBundleSupportedForChain,
    isSmartTransaction,
    isSwap,
    selectedAccount?.address,
  ]);

  return isGasIncluded7702Supported;
}
