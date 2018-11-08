module.exports = {
  getBuyEthUrl,
  getFaucets,
  getExchanges,
}
const ethNetProps = require('eth-net-props')

/**
 * Gives the caller a url at which the user can acquire coin, depending on the network they are in
 *
 * @param {object} opts Options required to determine the correct url
 * @param {string} opts.network The network for which to return a url
 * @param {string} opts.amount The amount of ETH to buy on coinbase. Only relevant if network === '1'.
 * @param {string} opts.address The address the bought ETH should be sent to.  Only relevant if network === '1'.
 * @param {number} opts.ind The position of the link (to faucet, or exchange) in the array of links for selected network
 * @returns {string|undefined} The url at which the user can access ETH, while in the given network. If the passed
 * network does not match any of the specified cases, or if no network is given, returns undefined.
 *
 */
function getBuyEthUrl ({ network, amount, address, ind }) {
  let url
  switch (network) {
    case '1':
    case '99':
    case '100':
      url = getExchanges({network, amount, address})[ind].link
      break
    case '3':
    case '4':
    case '42':
    case '77':
      url = getFaucets(network)[ind]
      break
  }
  return url
}

/**
 * Retrieves the array of faucets for given network ID of testnet
 *
 * @param {string} The network ID
 * @returns {array} The array of faucets for given network ID
 */
function getFaucets (network) {
  return ethNetProps.faucetLinks(network)
}

/**
 * Retrieves the array of exchanges for given network ID of production chain
 *
 * @param {object} opts Options required to determine the correct exchange service url
 * @param {string} opts.network The network ID
 * @param {string} opts.amount The amount of ETH to buy on coinbase. Only relevant if network === '1'.
 * @param {string} opts.address The address the bought ETH should be sent to.  Only relevant if network === '1'.
 * @returns {array} The array of exchanges for given network ID
 */
function getExchanges ({network, amount, address}) {
  const networkID = Number(network)
  switch (networkID) {
    case 1:
      return [
        {
          link: `https://buy.coinbase.com/?code=9ec56d01-7e81-5017-930c-513daa27bb6a&amount=${amount}&address=${address}&crypto_currency=ETH`,
        },
      ]
    case 99:
      return [
        {
          name: 'Binance',
          link: 'https://www.binance.com/en/trade/POA_ETH',
        },
        {
          name: 'BiBox',
          link: 'https://www.bibox.com/exchange?coinPair=POA_ETH',
        },
        {
          name: 'CEX Plus',
          link: 'http://cex.plus/market/poa_eth',
        },
      ]
    case 100:
      return [
        {
          name: 'xDai TokenBridge',
          link: 'https://dai-bridge.poa.network/',
        },
      ]
  }
}
