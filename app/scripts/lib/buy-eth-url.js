module.exports = {
  getBuyEthUrl,
  getFaucets,
  getExchanges,
}
const ethNetProps = require('eth-net-props')

const {
  POA_CODE,
  DAI_CODE,
  POA_SOKOL_CODE,
  MAINNET_CODE,
  CLASSIC_CODE,
  ROPSTEN_CODE,
  RINKEBY_CODE,
  KOVAN_CODE,
  GOERLI_TESTNET_CODE,
  RSK_CODE,
  RSK_TESTNET_CODE} = require('../controllers/network/enums')

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
  switch (Number(network)) {
    case MAINNET_CODE:
    case POA_CODE:
    case DAI_CODE:
    case CLASSIC_CODE:
    case RSK_CODE:
      url = getExchanges({network, amount, address})[ind].link
      break
    case ROPSTEN_CODE:
    case RINKEBY_CODE:
    case KOVAN_CODE:
    case POA_SOKOL_CODE:
    case RSK_TESTNET_CODE:
    case GOERLI_TESTNET_CODE:
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
    case CLASSIC_CODE:
      return [
        {
          name: 'Binance',
          link: 'https://www.binance.com/en/trade/ETC_ETH',
        },
      ]
    case POA_CODE:
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
        {
          name: 'HitBTC',
          link: 'https://hitbtc.com/POA-to-ETH',
        },
      ]
    case DAI_CODE:
      return [
        {
          name: 'xDai TokenBridge',
          link: 'https://dai-bridge.poa.network/',
        },
      ]
    case RSK_CODE:
      return [
        {
          name: 'Huobi',
          link: 'https://www.huobi.com/',
        },
        {
          name: 'Bitfinex',
          link: 'https://www.bitfinex.com/',
        },
        {
          name: 'Bitso',
          link: 'https://bitso.com/',
        },
      ]
    default:
      return []
  }
}
