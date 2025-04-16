import { getAccountLink } from '@metamask/etherscan-link';
import { KnownCaipNamespace, parseCaipChainId } from '@metamask/utils';
import { MultichainNetwork } from '../../../selectors/multichain';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { normalizeSafeAddress } from '../../../../app/scripts/lib/multichain/address';
import { MultichainProviderConfig } from '../../../../shared/constants/multichain/networks';
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
  const { namespace } = parseCaipChainId(network.chainId);
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31894
  // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
  if (namespace === KnownCaipNamespace.Eip155) {
    return getAccountLink(
      normalizeSafeAddress(address),
      network.network.chainId,
      network.network?.rpcPrefs,
    );
  }

  // We're in a non-EVM context, so we assume we can use format URLs instead.
  const { blockExplorerFormatUrls } =
    network.network as MultichainProviderConfig;
  if (blockExplorerFormatUrls) {
    return formatBlockExplorerAddressUrl(blockExplorerFormatUrls, address);
  }

  return '';
};
