const ObservableStore = require('obs-store')
const extend = require('xtend')
const log = require('loglevel')

// every ten minutes
const POLLING_INTERVAL = 10 * 60 * 1000

class InfuraController {

  constructor (opts = {}) {
    const initState = extend({
      infuraNetworkStatus: {},
    }, opts.initState)
    this.store = new ObservableStore(initState)
  }

  //
  // PUBLIC METHODS
  //

  // Responsible for retrieving the status of Infura's nodes. Can return either
  // ok, degraded, or down.
  async checkInfuraNetworkStatus () {
    const response = await fetch('https://api.infura.io/v1/status/metamask')
    const parsedResponse = await response.json()
    this.store.updateState({
      infuraNetworkStatus: parsedResponse,
    })
    return parsedResponse
  }

  scheduleInfuraNetworkCheck () {
    if (this.conversionInterval) {
      clearInterval(this.conversionInterval)
    }
    this.conversionInterval = setInterval(() => {
      this.checkInfuraNetworkStatus().catch(log.warn)
    }, POLLING_INTERVAL)
  }
}

module.exports = InfuraController
