import type {
  SentinelApiServiceMessenger,
  SentinelNetwork,
} from '@metamask/sentinel-api-service';
import { Hex, createProjectLogger } from '@metamask/utils';
import { hexToDecimal } from '../../../../shared/lib/conversion.utils';

export type { SentinelNetwork } from '@metamask/sentinel-api-service';

/**
 * Minimal messenger used to call the `SentinelApiService`.
 */
export type SentinelApiMessenger = Pick<SentinelApiServiceMessenger, 'call'>;

const log = createProjectLogger('sentinel-api');

let sentinelApiMessenger: SentinelApiMessenger | undefined;

/**
 * Sets the messenger used to query the `SentinelApiService`.
 * Called once when the `SentinelApiService` is initialized.
 *
 * @param messenger - Messenger able to call `SentinelApiService` actions.
 */
export function setSentinelApiMessenger(
  messenger: SentinelApiMessenger | undefined,
): void {
  sentinelApiMessenger = messenger;
}

/**
 * Gets the messenger used to query the `SentinelApiService`.
 *
 * @returns Messenger able to call `SentinelApiService` actions.
 */
export function getSentinelApiMessenger(): SentinelApiMessenger {
  if (!sentinelApiMessenger) {
    throw new Error('Sentinel API messenger not initialized');
  }

  return sentinelApiMessenger;
}

/**
 * Get Sentinel network flags by chain ID.
 *
 * @param chainId - The chain ID to get the network flags for.
 * @returns The Sentinel network flags for the given chain ID, or undefined if not supported or the request fails.
 */
export async function getSentinelNetworkFlags(
  chainId: Hex,
): Promise<SentinelNetwork | undefined> {
  try {
    return await getSentinelApiMessenger().call(
      'SentinelApiService:getNetwork',
      chainId,
    );
  } catch (error) {
    log('Failed to get network', chainId, error);
    return undefined;
  }
}

/**
 * Returns true if this chain supports sendBundle feature.
 *
 * @param chainId - The chain ID to check.
 * @returns A promise that resolves to true if sendBundle is supported, false otherwise.
 */
export async function isSendBundleSupported(chainId: Hex): Promise<boolean> {
  const network = await getSentinelNetworkFlags(chainId);
  return Boolean(network?.sendBundle);
}

/**
 * Returns the addresses the Sentinel relay submits transactions from on a given chain.
 *
 * @param chainId - The chain ID to get the signers for.
 * @returns A promise that resolves to the signer addresses, or an empty array if none are available.
 */
export async function getSentinelSigners(chainId: Hex): Promise<Hex[]> {
  const network = await getSentinelNetworkFlags(chainId);
  const signers = network?.cubistSigners;

  return Array.isArray(signers) ? signers : [];
}

/**
 * Returns a map of chain IDs to whether sendBundle is supported for each chain.
 *
 * @param chainIds - The chain IDs to check.
 * @returns A map of chain IDs to their sendBundle support status.
 */
export async function getSendBundleSupportedChains(
  chainIds: Hex[],
): Promise<Record<string, boolean>> {
  const networks = await getAllSentinelNetworkFlags();

  return chainIds.reduce<Record<string, boolean>>((acc, chainId) => {
    acc[chainId] = Boolean(networks[hexToDecimal(chainId)]?.sendBundle);
    return acc;
  }, {});
}

async function getAllSentinelNetworkFlags(): Promise<
  Record<string, SentinelNetwork>
> {
  try {
    return await getSentinelApiMessenger().call(
      'SentinelApiService:getNetworks',
    );
  } catch (error) {
    log('Failed to get networks', error);
    return {};
  }
}
