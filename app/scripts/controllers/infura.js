const ObservableStore = require('obs-store')
const extend = require('xtend')
const recentBlacklist = require('etheraddresslookup/blacklists/domains.json')

// every ten minutes
const POLLING_INTERVAL = 300000

class InfuraController {

  constructor (opts = {}) {
    const initState = extend({
      infuraNetworkStatus: {},
      blacklist: recentBlacklist,
    }, opts.initState)
    this.store = new ObservableStore(initState)
  }

  //
  // PUBLIC METHODS
  //

  // Responsible for retrieving the status of Infura's nodes. Can return either
  // ok, degraded, or down.
  checkInfuraNetworkStatus () {
    return fetch('https://api.infura.io/v1/status/metamask')
      .then(response => response.json())
      .then((parsedResponse) => {
        this.store.updateState({
          infuraNetworkStatus: parsedResponse,
        })
        return parsedResponse
      })
  }

  updateLocalBlacklist () {
    return fetch('https://api.infura.io/v1/blacklist')
      .then(response => response.json())
      .then((parsedResponse) => {
        this.store.updateState({
          blacklist: parsedResponse,
        })
        return parsedResponse
      })
  }

  scheduleInfuraNetworkCheck () {
    if (this.conversionInterval) {
      clearInterval(this.conversionInterval)
    }
    this.conversionInterval = setInterval(() => {
      this.checkInfuraNetworkStatus()
      this.updateLocalBlacklist()
    }, POLLING_INTERVAL)
  }
}

module.exports = InfuraController
