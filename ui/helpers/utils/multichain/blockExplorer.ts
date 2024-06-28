import { getAccountLink } from '@metamask/etherscan-link';
import { KnownCaipNamespace, parseCaipChainId } from '@metamask/utils';
import { MultichainNetwork } from '../../../selectors/multichain';
import { MULTICHAIN_NETWORK_TO_EXPLORER_URL } from '../../../../shared/constants/multichain/networks';
import { normalizeSafeAddress } from '../../../../app/scripts/lib/multichain/address';

export const getMultichainBlockExplorerUrl = (
  network: MultichainNetwork,
): string => {
  const { namespace } = parseCaipChainId(network.chainId);
  if (namespace === KnownCaipNamespace.Eip155) {
    return network.network?.rpcPrefs?.blockExplorerUrl ?? '';
  }

  const multichainExplorerUrl =
    MULTICHAIN_NETWORK_TO_EXPLORER_URL[
      network.chainId as keyof typeof MULTICHAIN_NETWORK_TO_EXPLORER_URL
    ] ?? '';

  return multichainExplorerUrl;
};

export const getMultichainAccountLink = (
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

  const multichainExplorerUrl = getMultichainBlockexplorerUrl(network);
  return multichainExplorerUrl ? `${multichainExplorerUrl}/${address}` : '';
};
