import { getAccountLink } from '@metamask/etherscan-link';
import { KnownCaipNamespace, parseCaipChainId } from '@metamask/utils';
import { MultichainNetwork } from '../../../selectors/multichain';
import { MULTICHAIN_NETWORK_BLOCK_EXPLORER_URL_MAP } from '../../../../shared/constants/multichain/networks';
import { normalizeSafeAddress } from '../../../../app/scripts/lib/multichain/address';

export const getMultichainBlockExplorerUrl = (
  network: MultichainNetwork,
): string => {
  const { namespace } = parseCaipChainId(network.chainId);
  if (namespace === KnownCaipNamespace.Eip155) {
    return network.network?.rpcPrefs?.blockExplorerUrl ?? '';
  }

  const multichainExplorerUrl =
    MULTICHAIN_NETWORK_BLOCK_EXPLORER_URL_MAP[
      network.chainId as keyof typeof MULTICHAIN_NETWORK_BLOCK_EXPLORER_URL_MAP
    ] ?? '';

  return multichainExplorerUrl;
};

export const getMultichainAccountUrl = (
  address: string,
  network: MultichainNetwork,
): string => {
  const { namespace } = parseCaipChainId(network.chainId);
  if (namespace === KnownCaipNamespace.Eip155) {
    return getAccountLink(
      normalizeSafeAddress(address),
      network.network.chainId,
      network.network?.rpcPrefs,
    );
  }

  const multichainExplorerUrl = getMultichainBlockExplorerUrl(network);
  return multichainExplorerUrl ? `${multichainExplorerUrl}/${address}` : '';
};
