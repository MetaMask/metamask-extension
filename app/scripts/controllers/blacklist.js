const ObservableStore = require('obs-store')
const extend = require('xtend')
const communityBlacklistedDomains = require('etheraddresslookup/blacklists/domains.json')
const communityWhitelistedDomains = require('etheraddresslookup/whitelists/domains.json')
const checkForPhishing = require('../lib/is-phish')

// compute phishing lists
const PHISHING_BLACKLIST = communityBlacklistedDomains.concat(['metamask.com'])
const PHISHING_WHITELIST = communityWhitelistedDomains.concat(['metamask.io', 'www.metamask.io'])
const PHISHING_FUZZYLIST = ['myetherwallet', 'myetheroll', 'ledgerwallet', 'metamask']
// every ten minutes
const POLLING_INTERVAL = 10 * 60 * 1000

class BlacklistController {

  constructor (opts = {}) {
    const initState = extend({
      phishing: PHISHING_BLACKLIST,
    }, opts.initState)
    this.store = new ObservableStore(initState)
    // polling references
    this._phishingUpdateIntervalRef = null
  }

  //
  // PUBLIC METHODS
  //

  checkForPhishing (hostname) {
    if (!hostname) return false
    const { blacklist } = this.store.getState()
    return checkForPhishing({ hostname, blacklist, whitelist: PHISHING_WHITELIST, fuzzylist: PHISHING_FUZZYLIST })
  }

  async updatePhishingList () {
    const response = await fetch('https://api.infura.io/v1/blacklist')
    const phishing = await response.json()
    this.store.updateState({ phishing })
    return phishing
  }

  scheduleUpdates () {
    if (this._phishingUpdateIntervalRef) return
    this._phishingUpdateIntervalRef = setInterval(() => {
      this.updatePhishingList()
    }, POLLING_INTERVAL)
  }
}

module.exports = BlacklistController
