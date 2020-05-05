import ObservableStore from 'obs-store'
import log from 'loglevel'

// every ten minutes
const POLLING_INTERVAL = 10 * 60 * 1000

export default class InfuraController {

  constructor (opts = {}) {
    const initState = Object.assign({
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
    const response = await window.fetch('https://api.infura.io/v1/status/metamask')
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
