const ObservableStore = require('obs-store')
const { warn } = require('loglevel')

// By default, poll every 3 minutes
const DEFAULT_INTERVAL = 180 * 1000

/**
 * A controller that polls for token exchange
 * rates based on a user's current token list
 */
class TokenRatesController {
  /**
   * Creates a TokenRatesController
   *
   * @param {Object} [config] - Options to configure controller
   */
  constructor ({ interval = DEFAULT_INTERVAL, preferences } = {}) {
    this.store = new ObservableStore()
    this.preferences = preferences
    this.interval = interval
  }

  /**
   * Updates exchange rates for all tokens
   */
  async updateExchangeRates () {
    if (!this.isActive) { return }
    const contractExchangeRates = {}
    for (const i in this._tokens) {
      if (this._tokens[i]) {
        const address = this._tokens[i].address
        contractExchangeRates[address] = await this.fetchExchangeRate(address)
      }
    }
    this.store.putState({ contractExchangeRates })
  }

  /**
   * Fetches a token exchange rate by address
   *
   * @param {String} address - Token contract address
   */
  async fetchExchangeRate (address) {
    try {
      const response = await fetch(`https://metamask.balanc3.net/prices?from=${address}&to=ETH&autoConversion=false&summaryOnly=true`)
      const json = await response.json()
      return json && json.length ? json[0].averagePrice : 0
    } catch (error) {
      warn(`Nifty Wallet - TokenRatesController exchange rate fetch failed for ${address}.`, error)
      return 0
    }
  }

  /**
   * @type {Number}
   */
  set interval (interval) {
    this._handle && clearInterval(this._handle)
    if (!interval) { return }
    this._handle = setInterval(() => { this.updateExchangeRates() }, interval)
  }

  /**
   * @type {Object}
   */
  set preferences (preferences) {
    this._preferences && this._preferences.unsubscribe()
    if (!preferences) { return }
    this._preferences = preferences
    this.tokens = preferences.getState().tokens
    preferences.subscribe(({ tokens = [] }) => { this.tokens = tokens })
  }

  /**
   * @type {Array}
   */
  set tokens (tokens) {
    this._tokens = tokens
    this.updateExchangeRates()
  }
}

module.exports = TokenRatesController
