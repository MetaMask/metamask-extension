import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { CaipChainId } from '@metamask/utils';
import {
  getGasFeesSponsoredNetworkEnabled,
  isHardwareWallet,
} from '../selectors';
import { convertCaipToHexChainId } from '../../shared/lib/network.utils';

export const useIsNetworkGasSponsored = (
  networkChainId: string | undefined,
): { isNetworkGasSponsored: boolean } => {
  // This selector provides the indication if the "Gas sponsored" label
  // is enabled based on the remote feature flag.
  const gasFeesSponsoredNetworkEnabledMap = useSelector(
    getGasFeesSponsoredNetworkEnabled,
  );
  const isHardwareWalletAccount = useSelector(isHardwareWallet);
  // Check if a network has gas sponsorship enabled
  return useMemo(() => {
    if (!networkChainId || isHardwareWalletAccount) {
      return { isNetworkGasSponsored: false };
    }
    // Convert chainId to hex if it's in CAIP format, otherwise use as-is
    let hexChainId: string;
    try {
      // Check if it's in CAIP format (contains ':')
      if (networkChainId.includes(':')) {
        hexChainId = convertCaipToHexChainId(networkChainId as CaipChainId);
      } else {
        // Already in hex format
        hexChainId = networkChainId;
      }
    } catch (error) {
      // If conversion fails, use the original chainId
      hexChainId = networkChainId;
    }
    return {
      isNetworkGasSponsored: Boolean(
        gasFeesSponsoredNetworkEnabledMap?.[
          hexChainId as keyof typeof gasFeesSponsoredNetworkEnabledMap
        ],
      ),
    };
  }, [
    gasFeesSponsoredNetworkEnabledMap,
    isHardwareWalletAccount,
    networkChainId,
  ]);
};
