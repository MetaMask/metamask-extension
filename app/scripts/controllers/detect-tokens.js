const contracts = require('eth-contract-metadata')
const {
    MAINNET,
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
  }

   /**
   * For each token in eth-contract-metada, find check selectedAddress balance.
   *
   */
  async exploreNewTokens () {
    if (!this.isActive) { return }
    if (this._network.getState().provider.type !== MAINNET) { return }
    let detectedTokenBalance, token
    for (const contractAddress in contracts) {
        const contract = contracts[contractAddress]
        if (contract.erc20 && !(contractAddress in this.tokens)) {
          detectedTokenBalance = await this.detectTokenBalance(contractAddress)
          if (detectedTokenBalance) {
            token = contracts[contractAddress]
            this._preferences.addToken(contractAddress, token['symbol'], token['decimals'])
          }
        }
    }
  }

   /**
   * Find if selectedAddress has tokens with contract in contractAddress.
   *
   * @param {string} contractAddress Hex address of the token contract to explore.
   * @returns {boolean} If balance is detected in token contract for address.
   *
   */
  async detectTokenBalance (contractAddress) {
    const address = this._preferences.store.getState().selectedAddress
    const response = await fetch(`https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=${contractAddress}&address=${address}&tag=latest&apikey=NCKS6GTY41KPHWRJB62ES1MDNRBIT174PV`)
    const parsedResponse = await response.json()
    if (parsedResponse.result !== '0') {
      return true
    }
    return false
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
