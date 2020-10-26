export default getBuyEthUrl

/**
 * Gives the caller a url at which the user can acquire eth, depending on the network they are in
 *
 * @param {Object} opts - Options required to determine the correct url
 * @param {string} opts.network The network for which to return a url
 * @param {string} opts.type The network type for which to return a url
 * @param {string} opts.amount The amount of ETH to buy on coinbase. Only relevant if network === '1'.
 * @param {string} opts.address The address the bought ETH should be sent to.  Only relevant if network === '1'.
 * @returns {string|undefined} - The url at which the user can access ETH, while in the given network. If the passed
 * network does not match any of the specified cases, or if no network is given, returns undefined.
 *
 */
function getBuyEthUrl ({ network, /* amount, */ address, service, type }) {
  // default service by network if not specified
  if (type && !service) {
    service = getDefaultServiceForType(type)
  }

  if (network !== undefined && !service) {
    service = getDefaultServiceForNetwork(network)
  }

  const MAINNET_LANCHED =
    new Date().getTime() >
    new Date(
      'Thu Oct 29 2020 00:10:00 GMT+0800 (China Standard Time)'
    ).getTime()
  switch (service) {
    case 'conflux-main-faucet':
      return MAINNET_LANCHED
        ? `https://confluxscan.io/sponsor`
        : `https://wallet.confluxscan.io/faucet/dev/ask?address=${address}`
    case 'conflux-test-faucet':
      return `http://test-faucet.conflux-chain.org:18088/dev/ask?address=${address}`
    default:
      throw new Error(`Unknown cryptocurrency exchange or faucet: "${service}"`)
  }
}

function getDefaultServiceForNetwork (network) {
  switch (network) {
    case '1029':
      return 'conflux-main-faucet'
    case '2':
      return 'conflux-main-faucet'
    case '0':
      return 'conflux-test-faucet'
    default:
      return
  }
}

function getDefaultServiceForType (type) {
  switch (type) {
    case 'mainnet':
      return 'conflux-main-faucet'
    case 'testnet':
      return 'conflux-test-faucet'
    default:
      return
  }
}
