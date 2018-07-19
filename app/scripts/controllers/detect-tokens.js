const Web3 = require('web3')
const contracts = require('eth-contract-metadata')
const { warn } = require('loglevel')
const { MAINNET } = require('./network/enums')
// By default, poll every 3 minutes
const DEFAULT_INTERVAL = 180 * 1000
const ERC20_ABI = [{'constant': true, 'inputs': [{'name': '_owner', 'type': 'address'}], 'name': 'balanceOf', 'outputs': [{'name': 'balance', 'type': 'uint256'}], 'payable': false, 'type': 'function'}]

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
    this._isActive = false
  }

  /**
   * For each token in eth-contract-metada, find check selectedAddress balance.
   *
   */
  async detectNewTokens () {
    if (!this._isActive) { return }
    if (this._network.store.getState().provider.type !== MAINNET) { return }
    this.web3.setProvider(this._network._provider)
    for (const contractAddress in contracts) {
      if (contracts[contractAddress].erc20 && !(this.tokenAddresses.includes(contractAddress.toLowerCase()))) {
        this.detectTokenBalance(contractAddress)
      }
    }
  }

   /**
   * Find if selectedAddress has tokens with contract in contractAddress.
   *
   * @param {string} contractAddress Hex address of the token contract to explore.
   * @returns {boolean} If balance is detected, token is added.
   *
   */
  async detectTokenBalance (contractAddress) {
    const ethContract = this.web3.eth.contract(ERC20_ABI).at(contractAddress)
    ethContract.balanceOf(this.selectedAddress, (error, result) => {
      if (!error) {
        if (!result.isZero()) {
          this._preferences.addToken(contractAddress, contracts[contractAddress].symbol, contracts[contractAddress].decimals)
        }
      } else {
        warn(`MetaMask - DetectTokensController balance fetch failed for ${contractAddress}.`, error)
      }
    })
  }

  /**
   * Restart token detection polling period and call detectNewTokens
   * in case of address change or user session initialization.
   *
   */
  restartTokenDetection () {
    if (this._isActive && this.selectedAddress) {
      this.detectNewTokens()
      this.interval = DEFAULT_INTERVAL
    }
  }

  /**
   * @type {Number}
   */
  set interval (interval) {
    this._handle && clearInterval(this._handle)
    if (!interval) { return }
    this._handle = setInterval(() => { this.detectNewTokens() }, interval)
  }

  /**
   * In setter when selectedAddress is changed, detectNewTokens and restart polling
   * @type {Object}
   */
  set preferences (preferences) {
    if (!preferences) { return }
    this._preferences = preferences
    preferences.store.subscribe(({ tokens }) => { this.tokenAddresses = tokens.map((obj) => { return obj.address }) })
    preferences.store.subscribe(({ selectedAddress }) => {
      if (this.selectedAddress !== selectedAddress) {
        this.selectedAddress = selectedAddress
        this.restartTokenDetection()
      }
    })
  }

  /**
   * @type {Object}
   */
  set network (network) {
    if (!network) { return }
    this._network = network
    this.web3 = new Web3(network._provider)
  }

  /**
  * In setter, when _isActive is changed, detectNewTokens and restart polling
  * @type {Object}
  */
  set isActive (active) {
    if (this._isActive !== active) {
        this._isActive = active
        this.restartTokenDetection()
      }
    }
}

module.exports = DetectTokensController
