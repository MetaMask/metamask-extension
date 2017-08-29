const ObservableStore = require('obs-store')
const extend = require('xtend')

// every ten minutes
const POLLING_INTERVAL = 600000

class CurrencyController {

  constructor (opts = {}) {
    const initState = extend({
      currentCurrency: 'ethusd',
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

  updateConversionRate () {
    const currentCurrency = this.getCurrentCurrency()
    return fetch(`https://api.infura.io/v1/ticker/${currentCurrency}`)
    .then(response => response.json())
    .then((parsedResponse) => {
      this.setConversionRate(Number(parsedResponse.bid))
      this.setConversionDate(Number(parsedResponse.timestamp))
    }).catch((err) => {
      if (err) {
        console.warn('MetaMask - Failed to query currency conversion.')
        this.setConversionRate(0)
        this.setConversionDate('N/A')
      }
    })
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
