// We should not rely on local storage in an extension!
// We should use this instead!
// https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/storage/local

const extension = require('extensionizer')
const { promisify } = require('util').promisify

module.exports = class ExtensionStore {
  constructor() {
    this.isSupported = !!(extension.storage.local)
    if (!this.isSupported) {
      log.error('Storage local API not available.')
    }
    const local = extension.storage.local
    this._get = promisify(local.get).bind(local)
    this._set = promisify(local.set).bind(local)
  }

  async get() {
    if (!this.isSupported) return undefined
    const result = await this._get()
    // extension.storage.local always returns an obj
    // if the object is empty, treat it as undefined
    if (isEmpty(result)) {
      return undefined
    } else {
      return result
    }
  }

  async set(state) {
    return this._set(state)
  }
}

function isEmpty(obj) {
  return 0 === Object.keys(obj).length
}
