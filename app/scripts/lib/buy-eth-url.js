module.exports = getBuyEthUrl

/**
 * Gives the caller a url at which the user can acquire eth, depending on the network they are in
 *
 * @param {object} opts Options required to determine the correct url
 * @param {string} opts.network The network for which to return a url
 * @param {string} opts.amount The amount of ETH to buy on coinbase. Only relevant if network === '1'.
 * @param {string} opts.address The address the bought ETH should be sent to.  Only relevant if network === '1'.
 * @returns {string|undefined} The url at which the user can access ETH, while in the given network. If the passed
 * network does not match any of the specified cases, or if no network is given, returns undefined.
 *
 */
function getBuyEthUrl ({ network, amount, address, exchange }) {
  let url
  switch (network) {
    case '1':
      url = `https://buy.coinbase.com/?code=9ec56d01-7e81-5017-930c-513daa27bb6a&amount=${amount}&address=${address}&crypto_currency=ETH`
      break

    case '3':
      url = 'https://faucet.metamask.io/'
      break

    case '4':
      url = 'https://www.rinkeby.io/'
      break

    case '42':
      url = 'https://github.com/kovan-testnet/faucet'
      break

    case '77':
      url = 'https://faucet.poa.network/'
      break

    case '99': {
      switch (exchange) {
        case 'binance':
          url = 'https://www.binance.com/en/trade/POA_ETH'
          break
        case 'bibox':
          url = 'https://www.bibox.com/exchange?coinPair=POA_ETH'
          break
        case 'cex.plus':
          url = 'http://cex.plus/market/poa_eth'
          break
      }
      break
    }
  }
  return url
}
