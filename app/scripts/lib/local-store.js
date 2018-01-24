// We should not rely on local storage in an extension!
// We should use this instead!
// https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/storage/local

const extension = require('extensionizer')

module.exports = class ExtensionStore {
  constructor() {
    this.isSupported = !!(extension.storage.local)
    if (!this.isSupported) {
      log.error('Storage local API not available.')
    }
  }
  get() {
    return new Promise((resolve) => {
      extension.storage.local.get(null, resolve)
    })
  }
  set(state) {
    return new Promise((resolve) => {
      extension.storage.local.set(state, resolve)
    })
  }
}
