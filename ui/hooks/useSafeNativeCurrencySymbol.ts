import { useEffect, useMemo, useRef } from 'react';
import { isStrictHexString } from '@metamask/utils';
import { hexToDecimal } from '../../shared/modules/conversion.utils';
import { useSafeChains } from '../pages/settings/networks-tab/networks-form/use-safe-chains';

/**
 * Custom hook to get the native currency symbol for a given chain ID
 *
 * @param chainId - The chain ID to get the native currency symbol for
 * @returns The native currency symbol or undefined if not found
 */
export const useSafeNativeCurrencySymbol = (
  chainId: string,
): string | undefined => {
  const { safeChains } = useSafeChains();
  const safeChainsRef = useRef(safeChains);

  // Use a ref to the current safeChains value bc the object changes on every render
  useEffect(() => {
    safeChainsRef.current = safeChains;
  }, [safeChains]);

  useEffect(() => {
    return () => {
      safeChainsRef.current = undefined;
    };
  }, []);

  return useMemo(() => {
    if (!safeChainsRef.current || !chainId) {
      return undefined;
    }

    const decimalChainId =
      isStrictHexString(chainId) && parseInt(hexToDecimal(chainId), 10);

    if (typeof decimalChainId !== 'number') {
      return undefined;
    }

    return safeChainsRef.current.find(
      (chain) => chain.chainId === decimalChainId.toString(),
    )?.nativeCurrency?.symbol;
    // Only update value when chainId changes
  }, [chainId]);
};
