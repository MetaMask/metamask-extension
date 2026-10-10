import type { Hex } from '@metamask/utils';
import { FEATURED_RPCS } from '../../../../shared/constants/network';
import { mmPayRpcErrors } from './errors';
import type { MmPayRpcMessenger } from './types';

/**
 * Returns the network client for a chain, adding the chain from the featured
 * networks first when it isn't configured.
 *
 * @param messenger - Root messenger.
 * @param chainId - The chain the transaction runs on.
 * @returns The network client ID.
 */
export async function ensureMmPayRpcNetwork(
  messenger: MmPayRpcMessenger,
  chainId: Hex,
): Promise<string> {
  try {
    await addFeaturedChainIfMissing(messenger, chainId);

    return messenger.call(
      'NetworkController:findNetworkClientIdByChainId',
      chainId,
    );
  } catch {
    throw mmPayRpcErrors.networkUnavailable(chainId);
  }
}

async function addFeaturedChainIfMissing(
  messenger: MmPayRpcMessenger,
  chainId: Hex,
) {
  const { networkConfigurationsByChainId } = messenger.call(
    'NetworkController:getState',
  );

  if (networkConfigurationsByChainId[chainId]) {
    return;
  }

  const networkConfiguration = FEATURED_RPCS.find(
    (featured) => featured.chainId === chainId,
  );

  if (!networkConfiguration) {
    throw new Error(`Chain ${chainId} is not a featured network`);
  }

  await messenger.call(
    'LegacyBackgroundApiService:addNetwork',
    networkConfiguration,
    { setActive: false },
  );
}
