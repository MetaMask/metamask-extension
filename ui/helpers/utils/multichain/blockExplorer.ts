import { getAccountLink } from '@metamask/etherscan-link';
import { KnownCaipNamespace, parseCaipChainId } from '@metamask/utils';
import { MultichainNetwork } from '../../../selectors/multichain';
import { normalizeSafeAddress } from '../../../../app/scripts/lib/multichain/address';

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
