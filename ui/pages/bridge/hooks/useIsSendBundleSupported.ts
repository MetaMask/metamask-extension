import { useEffect, useState } from 'react';
import { Hex } from '@metamask/utils';
import { isSendBundleSupported } from '../../../store/actions';

type Chain = {
  chainId: string;
};

/**
 * Custom hook to check if send bundle is supported for a chain
 *
 * @param fromChain - The source chain to check support for
 * @returns Whether send bundle is supported for the chain
 */
export function useIsSendBundleSupported(
  fromChain: Chain | null | undefined,
): boolean {
  const [isSendBundleSupportedForChain, setIsSendBundleSupportedForChain] =
    useState(false);

  useEffect(() => {
    let isCancelled = false;

    const checkSendBundleSupport = async () => {
      if (!fromChain?.chainId) {
        if (!isCancelled) {
          setIsSendBundleSupportedForChain(false);
        }
        return;
      }

      try {
        const isSupported = await isSendBundleSupported(
          fromChain.chainId as Hex,
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
  }, [fromChain?.chainId]);

  return isSendBundleSupportedForChain;
}
