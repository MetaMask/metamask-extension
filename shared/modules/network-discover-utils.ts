import { type MultichainNetworkConfiguration } from '@metamask/multichain-network-controller';
import { type Hex } from '@metamask/utils';
import { CHAIN_ID_PROFOLIO_LANDING_PAGE_URL_MAP } from '../constants/network';
import { convertCaipToHexChainId } from './network.utils';

// Determines if the discover button should be enabled for a given network
// based on feature flags and URL mapping availability.
export const isDiscoverButtonEnabled = (
  network: MultichainNetworkConfiguration,
  featureFlags: Record<string, boolean>,
): boolean => {
  const { chainId, isEvm } = network;

  if (isEvm) {
    const hexChainId = convertCaipToHexChainId(chainId);
    return Boolean(
      (featureFlags as Record<Hex, boolean>)?.[hexChainId] &&
        CHAIN_ID_PROFOLIO_LANDING_PAGE_URL_MAP[hexChainId],
    );
  }

  return Boolean(
    featureFlags?.[chainId] && CHAIN_ID_PROFOLIO_LANDING_PAGE_URL_MAP[chainId],
  );
};
