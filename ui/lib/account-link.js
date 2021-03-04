import { createAccountLinkForChain } from '@metamask/etherscan-link';

export default function getAccountLink(address, chainId, rpcPrefs) {
  if (rpcPrefs && rpcPrefs.blockExplorerUrl) {
    return `${rpcPrefs.blockExplorerUrl.replace(
      /\/+$/u,
      '',
    )}/address/${address}`;
  }

  return createAccountLinkForChain(address, chainId);
}
