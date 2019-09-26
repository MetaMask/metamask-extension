const Web3 = require('web3')
const contracts = require('eth-contract-metadata')
const { warn } = require('loglevel')
const { MAINNET } = require('./network/enums')
// By default, poll every 3 minutes
const DEFAULT_INTERVAL = 180 * 1000
const ERC20_ABI = [{'constant': true, 'inputs': [{'name': '_owner', 'type': 'address'}], 'name': 'balanceOf', 'outputs': [{'name': 'balance', 'type': 'uint256'}], 'payable': false, 'type': 'function'}]
const SINGLE_CALL_BALANCES_ABI = require('single-call-balance-checker-abi')
const SINGLE_CALL_BALANCES_ADDRESS = '0xb1f8e55c7f64d203c1400b9d8555d050f94adf39'
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
  constructor ({ interval = DEFAULT_INTERVAL, preferences, network, keyringMemStore } = {}) {
    this.preferences = preferences
    this.interval = interval
    this.network = network
    this.keyringMemStore = keyringMemStore
  }

  /**
   * For each token in eth-contract-metada, find check selectedAddress balance.
   *
   */
  async detectNewTokens () {
    if (!this.isActive) { return }
    if (this._network.store.getState().provider.type !== MAINNET) { return }
    const tokensToDetect = []
    this.web3.setProvider(this._network._provider)
    for (const contractAddress in contracts) {
      if (contracts[contractAddress].erc20 && !(this.tokenAddresses.includes(contractAddress.toLowerCase()))) {
        tokensToDetect.push(contractAddress)
      }
    }

    const ethContract = this.web3.eth.contract(SINGLE_CALL_BALANCES_ABI).at(SINGLE_CALL_BALANCES_ADDRESS)
    ethContract.balances([this.selectedAddress], tokensToDetect, (error, result) => {
      if (error) {
        warn(`MetaMask - DetectTokensController single call balance fetch failed`, error)
        return
      }
      tokensToDetect.forEach((tokenAddress, index) => {
        const balance = result[index]
        if (balance && !balance.isZero()) {
          this._preferences.addToken(tokenAddress, contracts[tokenAddress].symbol, contracts[tokenAddress].decimals)
        }
      })
    })
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
    if (!(this.isActive && this.selectedAddress)) { return }
    this.detectNewTokens()
    this.interval = DEFAULT_INTERVAL
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
    preferences.store.subscribe(({ tokens = [] }) => { this.tokenAddresses = tokens.map((obj) => { return obj.address }) })
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
   * In setter when isUnlocked is updated to true, detectNewTokens and restart polling
   * @type {Object}
   */
  set keyringMemStore (keyringMemStore) {
    if (!keyringMemStore) { return }
    this._keyringMemStore = keyringMemStore
    this._keyringMemStore.subscribe(({ isUnlocked }) => {
      if (this.isUnlocked !== isUnlocked) {
        this.isUnlocked = isUnlocked
        if (isUnlocked) { this.restartTokenDetection() }
      }
    })
  }

  /**
   * Internal isActive state
   * @type {Object}
   */
  get isActive () {
    return this.isOpen && this.isUnlocked
  }
}

module.exports = DetectTokensController
