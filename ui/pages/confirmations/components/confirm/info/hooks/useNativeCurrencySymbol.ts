import { CaipChainId, Hex } from '@metamask/utils';
import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import { getAllMultichainNetworkConfigurations } from '../../../../../../selectors';

const currencySymbolOverrides: {
  [key: Hex | CaipChainId]: string;
} = {
  // Tempo Mainnet (no native, local config 'USD' but we prefer to display 'pathUSD')
  'eip155:4217': 'pathUSD',
  // Tempo Testnet (no native, local config 'USD' but we prefer to display 'pathUSD')
  'eip155:42431': 'pathUSD',
};

/**
 * This hook is meant to allow collecting the native currency of a given chain ensuring:
 * - "Multichain" compatibility (non-EVM included).
 * - Allowing overrides so we display a given native token regardless of user local config.
 *
 * @param chainId - chainId, either in Hex format (0x1079) or Caip format (slip155:4217).
 * @returns the native symbol to be displayed to the user for that chain.
 */
export const useNativeCurrencySymbol = (chainId?: Hex | CaipChainId) => {
  const multichainNetworks = useSelector(getAllMultichainNetworkConfigurations);
  return useMemo(() => {
    // chainId can be undefined during view transistions which escapes inference.
    // 'ETH' is often used as fallback for native token symbol.
    if (!chainId) {
      return { nativeCurrencySymbol: 'ETH' };
    }
    const caipChainId = (
      chainId.startsWith('0x')
        ? `eip155:${Number.parseInt(chainId, 16)}`
        : chainId
    ) as CaipChainId;
    const nativeCurrencySymbol =
      currencySymbolOverrides[caipChainId] ??
      multichainNetworks[caipChainId]?.nativeCurrency ??
      'ETH';
    return { nativeCurrencySymbol };
  }, [chainId, multichainNetworks]);
};
