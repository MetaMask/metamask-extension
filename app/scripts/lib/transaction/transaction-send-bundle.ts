import { createProjectLogger, Hex } from '@metamask/utils';
import { getNetworkData, getNetworkDataByChainId } from './sentinel-api';
import { hexToDecimal } from '../../../../shared/modules/conversion.utils';

const log = createProjectLogger('transaction-send-bundle');

/**
 * Returns true if this chain supports sendBundle feature.
 */
export async function isSendBundleSupported(chainId: Hex): Promise<boolean> {
  const network = await getNetworkDataByChainId(chainId);

    if (!network?.sendBundle) {
    log('Chain is not supported', chainId);
    return false;
  }

  return network?.sendBundle;
}

/**
 * Returns a map of chain IDs to whether sendBundle is supported for each chain.
 */
export async function getSendBundleSupportedChains(
  chainIds: Hex[],
): Promise<Record<string, boolean>> {
  const networkData = await getNetworkData();

  return chainIds.reduce<Record<string, boolean>>((acc, chainId) => {
    const chainIdDecimal = hexToDecimal(chainId);
    const network = networkData[chainIdDecimal];
    acc[chainId] = network?.sendBundle ?? false;
    return acc;
  }, {});
}