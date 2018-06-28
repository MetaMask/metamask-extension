const ObservableStore = require('obs-store')
const { warn } = require('loglevel')
const contracts = require('eth-contract-metadata')
const {
    ROPSTEN,
    RINKEBY,
    KOVAN,
    MAINNET,
    OCALHOST,
    } = require('./network/enums')

// By default, poll every 3 minutes
const DEFAULT_INTERVAL = 180 * 1000

/**
 * A controller that polls for token exchange
 * rates based on a user's current token list
 */
class DetectTokensController {
  /**
   * Creates a DetectTokensController
   *
   * @param {Object} [config] - Options to configure controller
   */
  constructor ({ interval = DEFAULT_INTERVAL, preferences, network } = {}) {
    this.preferences = preferences
    this.interval = interval
    this.network = network
    this.contracts = contracts
  }

   /**
   * For each token in eth-contract-metada, find check selectedAddress balance.
   *
   */
  async exploreNewTokens () {
    if (!this.isActive) { return }
    if (this._network.getState().provider.type !== MAINNET) { return }
    let detectedTokenAddress, token
    for (const address in this.contracts) {
        const contract = this.contracts[address]
        if (contract.erc20 && !(address in this.tokens)) {
          detectedTokenAddress = await this.fetchContractAccountBalance(address) 
          if (detectedTokenAddress) {
            token = this.contracts[detectedTokenAddress]
            this._preferences.addToken(detectedTokenAddress, token['symbol'], token['decimals'])
          }
        }
        // etherscan restriction, 5 request/second, lazy scan
        setTimeout(() => {}, 200)
    }
  }

   /**
   * Find if selectedAddress has tokens with contract in contractAddress.
   *
   * @param {string} contractAddress Hex address of the token contract to explore.
   * @returns {string} Contract address to be added to tokens.
   *
   */
  async fetchContractAccountBalance (contractAddress) {
    const address = this._preferences.store.getState().selectedAddress
    const response = await fetch(`https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=${contractAddress}&address=${address}&tag=latest&apikey=NCKS6GTY41KPHWRJB62ES1MDNRBIT174PV`)
    const parsedResponse = await response.json()
    if (parsedResponse.result !== '0') {
      return contractAddress
    }
    return null
  }

  /**
   * @type {Number}
   */
  set interval (interval) {
    this._handle && clearInterval(this._handle)
    if (!interval) { return }
    this._handle = setInterval(() => { this.exploreNewTokens() }, interval)
  }

    /**
   * @type {Object}
   */
  set preferences (preferences) {
    if (!preferences) { return }
    this._preferences = preferences
    this.tokens = preferences.store.getState().tokens
  
  }

      /**
   * @type {Object}
   */
  set network (network) {
    if (!network) { return }
    this._network = network
  }
}

module.exports = DetectTokensController
