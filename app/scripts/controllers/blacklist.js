const ObservableStore = require('obs-store')
const extend = require('xtend')
const PhishingDetector = require('eth-phishing-detect/src/detector')

// compute phishing lists
const PHISHING_DETECTION_CONFIG = require('eth-phishing-detect/src/config.json')
// every ten minutes
const POLLING_INTERVAL = 10 * 60 * 1000

class BlacklistController {

  constructor (opts = {}) {
    const initState = extend({
      phishing: PHISHING_DETECTION_CONFIG,
    }, opts.initState)
    this.store = new ObservableStore(initState)
    // phishing detector
    this._phishingDetector = null
    this._setupPhishingDetector(initState.phishing)
    // polling references
    this._phishingUpdateIntervalRef = null
  }

  //
  // PUBLIC METHODS
  //

  checkForPhishing (hostname) {
    if (!hostname) return false
    const { result } = this._phishingDetector.check(hostname)
    return result
  }

  async updatePhishingList () {
    const response = await fetch('https://api.infura.io/v2/blacklist')
    const phishing = await response.json()
    this.store.updateState({ phishing })
    this._setupPhishingDetector(phishing)
    return phishing
  }

  scheduleUpdates () {
    if (this._phishingUpdateIntervalRef) return
    this._phishingUpdateIntervalRef = setInterval(() => {
      this.updatePhishingList()
    }, POLLING_INTERVAL)
  }

  //
  // PRIVATE METHODS
  //

  _setupPhishingDetector (config) {
    this._phishingDetector = new PhishingDetector(config)
  }
}

module.exports = BlacklistController
