import { useEffect, useMemo, useRef } from 'react';
import { isStrictHexString } from '@metamask/utils';
import { hexToDecimal } from '../../shared/modules/conversion.utils';
import { useSafeChains } from '../pages/settings/networks-tab/networks-form/use-safe-chains';

/**
 * Custom hook to get the native currency symbol for a given chain ID
 * @param chainId - The chain ID to get the native currency symbol for
 * @returns The native currency symbol or undefined if not found
 */
export const useSafeNativeCurrencySymbol = (
  chainId: string,
): string | undefined => {
  const { safeChains } = useSafeChains();

  const safeChainsRef = useRef(safeChains);

  useEffect(() => {
    safeChainsRef.current = safeChains;
  }, [safeChains]);

  return useMemo(() => {
    if (!safeChainsRef || !chainId) {
      return undefined;
    }

    const decimalChainId =
      isStrictHexString(chainId) && parseInt(hexToDecimal(chainId), 10);

    if (typeof decimalChainId !== 'number') {
      return undefined;
    }

    return safeChainsRef.current?.find(
      (chain) => chain.chainId === decimalChainId.toString(),
    )?.nativeCurrency?.symbol;
  }, [safeChainsRef, chainId]);
};
