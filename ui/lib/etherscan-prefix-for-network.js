import * as networkEnums from '../../shared/constants/network';

/**
 * Gets the etherscan.io URL prefix for a given network ID.
 *
 * @param {string} chainId - The chain ID to get the prefix for.
 * @returns {string} The etherscan.io URL prefix for the given network ID.
 */
export function getEtherscanNetworkPrefix(chainId) {
  switch (chainId) {
    case networkEnums.ROPSTEN_CHAIN_ID:
      return 'ropsten.';
    case networkEnums.RINKEBY_CHAIN_ID:
      return 'rinkeby.';
    case networkEnums.KOVAN_CHAIN_ID:
      return 'kovan.';
    case networkEnums.GOERLI_CHAIN_ID:
      return 'goerli.';
    default:
      // also covers mainnet
      return '';
  }
}
