const ObservableStore = require('obs-store')
const extend = require('xtend')

// every ten minutes
const POLLING_INTERVAL = 600000

class CurrencyController {

  constructor (opts = {}) {
    const initState = extend({
      currentCurrency: 'usd',
      conversionRate: 0,
      conversionDate: 'N/A',
    }, opts.initState)
    this.store = new ObservableStore(initState)
  }

  //
  // PUBLIC METHODS
  //

  getCurrentCurrency () {
    return this.store.getState().currentCurrency
  }

  setCurrentCurrency (currentCurrency) {
    this.store.updateState({ currentCurrency })
  }

  getConversionRate () {
    return this.store.getState().conversionRate
  }

  setConversionRate (conversionRate) {
    this.store.updateState({ conversionRate })
  }

  getConversionDate () {
    return this.store.getState().conversionDate
  }

  setConversionDate (conversionDate) {
    this.store.updateState({ conversionDate })
  }

  async updateConversionRate () {
    let currentCurrency
    try {
      currentCurrency = this.getCurrentCurrency()
      const response = await fetch(`https://api.akroma.io/prices`)
      console.log(response)
      const parsedResponse = await response.json()
      this.setConversionRate(Number(parsedResponse[0].usdRaw))
      this.setConversionDate('N/A')
    } catch (err) {
      log.warn(`MetaMask - Failed to query currency conversion:`, currentCurrency, err)
      this.setConversionRate(0)
      this.setConversionDate('N/A')
    }
  }

  scheduleConversionInterval () {
    if (this.conversionInterval) {
      clearInterval(this.conversionInterval)
    }
    this.conversionInterval = setInterval(() => {
      this.updateConversionRate()
    }, POLLING_INTERVAL)
  }
}

module.exports = CurrencyController
