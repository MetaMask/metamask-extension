const ObservableStore = require('obs-store')
const extend = require('xtend')

/**
 * A controller that stores info about audited addresses
 */
class AddressAuditController {
  /**
   * Creates a AddressAuditController
   *
   * @param {Object} [config] - Options to configure controller
   */
  constructor (opts = {}) {
    const { initState } = opts
    this.store = new ObservableStore(extend({
      addressAudits: {},
    }, initState))
  }

  add ({ address, auditor, status, message }) {
    const currentState = this.store.getState()
    const currentStateAudits = currentState.addressAudits
    const currentAddressAudits = currentStateAudits && currentStateAudits[address] || {}

    this.store.updateState({
      addressAudits: {
        ...currentStateAudits,
        [address]: {
          ...currentAddressAudits,
          [auditor]: {
            address,
            auditor,
            status,
            message,
            timestamp: Date.now(),
          },
        },
      },
    })
  }

  clearAudits () {
    this.store.updateState({ audits: {} })
  }

}

module.exports = AddressAuditController
