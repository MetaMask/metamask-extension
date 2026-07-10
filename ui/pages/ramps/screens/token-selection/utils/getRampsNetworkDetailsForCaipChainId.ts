import { type CaipChainId } from '@metamask/utils';
import {
  BRIDGE_CHAIN_ID_TO_NETWORK_IMAGE_MAP,
  NETWORK_TO_SHORT_NETWORK_NAME_MAP,
} from '../../../../../../shared/constants/bridge';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../../../../shared/constants/network';
import { MULTICHAIN_TOKEN_IMAGE_MAP } from '../../../../../../shared/constants/multichain/networks';
import { convertCaipToHexChainId } from '../../../../../../shared/lib/network.utils';

export function getRampsNetworkDetailsForCaipChainId(
  caipChainId: CaipChainId,
  configuredName?: string,
): { networkName: string; networkImage: string } {
  const shortName =
    NETWORK_TO_SHORT_NETWORK_NAME_MAP[
      caipChainId as keyof typeof NETWORK_TO_SHORT_NETWORK_NAME_MAP
    ];

  const networkName = shortName || configuredName?.trim() || caipChainId;

  const bridgeImage =
    BRIDGE_CHAIN_ID_TO_NETWORK_IMAGE_MAP[
      caipChainId as keyof typeof BRIDGE_CHAIN_ID_TO_NETWORK_IMAGE_MAP
    ];

  let networkImage =
    bridgeImage || MULTICHAIN_TOKEN_IMAGE_MAP[caipChainId] || '';

  if (!networkImage && caipChainId.startsWith('eip155:')) {
    try {
      const hexChainId = convertCaipToHexChainId(caipChainId);
      networkImage = CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[hexChainId] || '';
    } catch {
      networkImage = '';
    }
  }

  return { networkName, networkImage };
}
