import {
  GOERLI_CHAIN_ID,
  KOVAN_CHAIN_ID,
  MAINNET_CHAIN_ID,
  RINKEBY_CHAIN_ID,
  ROPSTEN_CHAIN_ID,
} from '../../../shared/constants/network';

/**
 * Gives the caller a url at which the user can acquire eth, depending on the network they are in
 *
 * @param {Object} opts - Options required to determine the correct url
 * @param {string} opts.chainId - The chainId for which to return a url
 * @param {string} opts.address - The address the bought ETH should be sent to.  Only relevant if chainId === '0x1'.
 * @returns {string|undefined} The url at which the user can access ETH, while in the given chain. If the passed
 * chainId does not match any of the specified cases, or if no chainId is given, returns undefined.
 *
 */
export default function getBuyEthUrl({ chainId, address, service }) {
  // default service by network if not specified
  if (!service) {
    // eslint-disable-next-line no-param-reassign
    service = getDefaultServiceForChain(chainId);
  }

  switch (service) {
    case 'wyre':
      return `https://pay.sendwyre.com/purchase?dest=ethereum:${address}&destCurrency=ETH&accountId=AC-7AG3W4XH4N2&paymentMethod=debit-card`;
    case 'metamask-faucet':
      return 'https://faucet.metamask.io/';
    case 'rinkeby-faucet':
      return 'https://www.rinkeby.io/';
    case 'kovan-faucet':
      return 'https://github.com/kovan-testnet/faucet';
    case 'goerli-faucet':
      return 'https://goerli-faucet.slock.it/';
    default:
      throw new Error(
        `Unknown cryptocurrency exchange or faucet: "${service}"`,
      );
  }
}

function getDefaultServiceForChain(chainId) {
  switch (chainId) {
    case MAINNET_CHAIN_ID:
      return 'wyre';
    case ROPSTEN_CHAIN_ID:
      return 'metamask-faucet';
    case RINKEBY_CHAIN_ID:
      return 'rinkeby-faucet';
    case KOVAN_CHAIN_ID:
      return 'kovan-faucet';
    case GOERLI_CHAIN_ID:
      return 'goerli-faucet';
    default:
      throw new Error(
        `No default cryptocurrency exchange or faucet for chainId: "${chainId}"`,
      );
  }
}
