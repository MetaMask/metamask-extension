import { getAccountLink } from '@metamask/etherscan-link';
import { KnownCaipNamespace, parseCaipChainId } from '@metamask/utils';
import { MultichainNetwork } from '../../../selectors/multichain';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { normalizeSafeAddress } from '../../../../app/scripts/lib/multichain/address';
import { MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP } from '../../../../shared/constants/multichain/networks';
import { formatBlockExplorerAddressUrl } from '../../../../shared/lib/multichain/networks';

export const getMultichainBlockExplorerUrl = (
  network: MultichainNetwork,
): string => {
  return network.network?.rpcPrefs?.blockExplorerUrl ?? '';
};

export const getMultichainAccountUrl = (
  address: string,
  network: MultichainNetwork,
): string => {
  const { chainId } = network;
  const { namespace } = parseCaipChainId(chainId);
  const blockExplorerFormatUrls =
    MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP[chainId];
  if (namespace === KnownCaipNamespace.Eip155) {
    return getAccountLink(
      normalizeSafeAddress(address),
      chainId,
      // @ts-expect-error - ignore error
      blockExplorerFormatUrls?.url,
    );
  }

  // We're in a non-EVM context, so we assume we can use format URLs instead.
  if (blockExplorerFormatUrls) {
    return formatBlockExplorerAddressUrl(blockExplorerFormatUrls, address);
  }

  return '';
};
