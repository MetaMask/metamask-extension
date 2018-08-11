const ObservableStore = require('obs-store')
const extend = require('xtend')
const PhishingDetector = require('eth-phishing-detect/src/detector')
const log = require('loglevel')

// compute phishing lists
const PHISHING_DETECTION_CONFIG = require('eth-phishing-detect/src/config.json')
// every four minutes
const POLLING_INTERVAL = 4 * 60 * 1000

class BlacklistController {

  /**
   * Responsible for polling for and storing an up to date 'eth-phishing-detect' config.json file, while
   * exposing a method that can check whether a given url is a phishing attempt. The 'eth-phishing-detect'
   * config.json file contains a fuzzylist, whitelist and blacklist.
   *
   *
   * @typedef {Object} BlacklistController
   * @param {object} opts Overrides the defaults for the initial state of this.store
   * @property {object} store The the store of the current phishing config
   * @property {object} store.phishing Contains fuzzylist, whitelist and blacklist arrays. @see
   * {@link https://github.com/MetaMask/eth-phishing-detect/blob/master/src/config.json}
   * @property {object} _phishingDetector The PhishingDetector instantiated by passing store.phishing to
   * PhishingDetector.
   * @property {object} _phishingUpdateIntervalRef Id of the interval created to periodically update the blacklist
   *
   */
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

  /**
   * Given a url, returns the result of checking if that url is in the store.phishing blacklist
   *
   * @param {string} hostname The hostname portion of a url; the one that will be checked against the white and
   * blacklists of store.phishing
   * @returns {boolean} Whether or not the passed hostname is on our phishing blacklist
   *
   */
  checkForPhishing (hostname) {
    if (!hostname) return false
    const { result } = this._phishingDetector.check(hostname)
    return result
  }

  /**
   * Queries `https://api.infura.io/v2/blacklist` for an updated blacklist config. This is passed to this._phishingDetector
   * to update our phishing detector instance, and is updated in the store. The new phishing config is returned
   *
   *
   * @returns {Promise<object>} Promises the updated blacklist config for the phishingDetector
   *
   */
  async updatePhishingList () {
    const response = await fetch('https://api.infura.io/v2/blacklist')
    const phishing = await response.json()
    this.store.updateState({ phishing })
    this._setupPhishingDetector(phishing)
    return phishing
  }

  /**
   * Initiates the updating of the local blacklist at a set interval. The update is done via this.updatePhishingList().
   * Also, this method store a reference to that interval at this._phishingUpdateIntervalRef
   *
   */
  scheduleUpdates () {
    if (this._phishingUpdateIntervalRef) return
    this.updatePhishingList().catch(log.warn)
    this._phishingUpdateIntervalRef = setInterval(() => {
      this.updatePhishingList().catch(log.warn)
    }, POLLING_INTERVAL)
  }

  /**
   * Sets this._phishingDetector to a new PhishingDetector instance.
   * @see {@link https://github.com/MetaMask/eth-phishing-detect}
   *
   * @private
   * @param {object} config A config object like that found at {@link https://github.com/MetaMask/eth-phishing-detect/blob/master/src/config.json}
   *
   */
  _setupPhishingDetector (config) {
    this._phishingDetector = new PhishingDetector(config)
  }
}

module.exports = BlacklistController
