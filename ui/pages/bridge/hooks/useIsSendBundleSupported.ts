import { useEffect, useState } from 'react';
import {
  formatChainIdToHex,
  isNonEvmChainId,
} from '@metamask/bridge-controller';
import { isSendBundleSupported } from '../../../store/actions';
import type { BridgeToken } from '../../../ducks/bridge/types';

/**
 * Custom hook to check if send bundle is supported for a chain
 *
 * @param fromChainId - The source chain id to check support for
 * @returns Whether send bundle is supported for the chain
 */
export function useIsSendBundleSupported(
  fromChainId: BridgeToken['chainId'],
): boolean {
  const [isSendBundleSupportedForChain, setIsSendBundleSupportedForChain] =
    useState(false);

  useEffect(() => {
    let isCancelled = false;

    const checkSendBundleSupport = async () => {
      if (!fromChainId) {
        if (!isCancelled) {
          setIsSendBundleSupportedForChain(false);
        }
        return;
      }

      if (isNonEvmChainId(fromChainId)) {
        setIsSendBundleSupportedForChain(false);
        return;
      }

      try {
        const isSupported = await isSendBundleSupported(
          formatChainIdToHex(fromChainId),
        );

        if (!isCancelled) {
          setIsSendBundleSupportedForChain(isSupported);
        }
      } catch (error) {
        if (!isCancelled) {
          console.error('Error checking send bundle support:', error);
          setIsSendBundleSupportedForChain(false);
        }
      }
    };

    checkSendBundleSupport();

    return () => {
      isCancelled = true;
    };
  }, [fromChainId]);

  return isSendBundleSupportedForChain;
}
