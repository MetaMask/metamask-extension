import { InternalAccount, isEvmAccountType } from '@metamask/keyring-api';
import { getAccountLink } from '@metamask/etherscan-link';
import { isCaipChainId, parseCaipChainId } from '@metamask/utils';
import { MultichainNetwork } from '../../../selectors/multichain';
import { MULTICHAIN_NETWORK_TO_EXPLORER_URL } from '../../../../shared/constants/multichain/networks';

export const getMultichainBlockexplorerUrl = (
  account: InternalAccount,
  network: MultichainNetwork,
): string => {
  if (isEvmAccountType(account.type)) {
    return network.network?.rpcPrefs?.blockExplorerUrl ?? '';
  }

  const multichainExplorerUrl =
    MULTICHAIN_NETWORK_TO_EXPLORER_URL[
      network.chainId as keyof typeof MULTICHAIN_NETWORK_TO_EXPLORER_URL
    ] ?? '';

  return multichainExplorerUrl;
};

export const getMultichainAccountLink = (
  account: InternalAccount,
  network: MultichainNetwork,
): string => {
  if (isEvmAccountType(account.type)) {
    const chainId = parseCaipChainId(network.chainId).reference;
    return getAccountLink(account.address, chainId, network.network?.rpcPrefs);
  }

  const multichainExplorerUrl = getMultichainBlockexplorerUrl(account, network);

  return multichainExplorerUrl
    ? `${multichainExplorerUrl}/${account.address}`
    : '';
};
