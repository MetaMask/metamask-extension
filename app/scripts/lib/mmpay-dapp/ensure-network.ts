import type { Hex } from '@metamask/utils';
import { rpcErrors } from '@metamask/rpc-errors';

import { FEATURED_RPCS } from '../../../../shared/constants/network';

type AddNetworkResult = {
  rpcEndpoints: { networkClientId: string }[];
  defaultRpcEndpointIndex: number;
};

// Minimal messenger interface required by this helper.
export type EnsureNetworkMessenger = {
  call(
    action: 'NetworkController:findNetworkClientIdByChainId',
    chainId: Hex,
  ): string | undefined;
  call(
    action: 'NetworkController:addNetwork',
    networkConfig: unknown,
  ): Promise<AddNetworkResult>;
};

/**
 * Ensures a network client exists for the given chainId. If the client is
 * missing, adds Arbitrum from FEATURED_RPCS (the same list the UI uses in
 * usePerpsNetworkManagement.ts). Returns the networkClientId.
 *
 * @param messenger - Messenger with the required NetworkController actions.
 * @param chainId - Chain ID to find or add.
 * @returns The network client ID for the requested chain.
 * @throws rpcErrors.internal if the chain is not found and cannot be added.
 */
export async function ensureNetworkClient(
  messenger: EnsureNetworkMessenger,
  chainId: Hex,
): Promise<string> {
  try {
    const networkClientId = messenger.call(
      'NetworkController:findNetworkClientIdByChainId',
      chainId,
    );

    if (networkClientId) {
      return networkClientId;
    }
  } catch {
    // Chain not configured yet; fall through and add it from FEATURED_RPCS.
  }

  const networkConfig = FEATURED_RPCS.find((rpc) => rpc.chainId === chainId);
  if (!networkConfig) {
    throw rpcErrors.internal({ message: 'Arbitrum network unavailable' });
  }

  const result = await messenger.call(
    'NetworkController:addNetwork',
    networkConfig,
  );

  const endpoint = result.rpcEndpoints[result.defaultRpcEndpointIndex];
  if (!endpoint?.networkClientId) {
    throw rpcErrors.internal({ message: 'Arbitrum network unavailable' });
  }

  return endpoint.networkClientId;
}
