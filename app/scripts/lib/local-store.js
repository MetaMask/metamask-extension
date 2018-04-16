// We should not rely on local storage in an extension!
// We should use this instead!
// https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/storage/local

const extension = require('extensionizer')
const log = require('loglevel')

module.exports = class ExtensionStore {
  constructor() {
    this.isSupported = !!(extension.storage.local)
    if (!this.isSupported) {
      log.error('Storage local API not available.')
    }
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

  _get() {
    const local = extension.storage.local
    return new Promise((resolve, reject) => {
      local.get(null, (result) => {
        const err = extension.runtime.lastError
        if (err) {
          reject(err)
        } else {
          resolve(result)
        }
      })
    })
  }

  _set(obj) {
    const local = extension.storage.local
    return new Promise((resolve, reject) => {
      local.set(obj, () => {
        const err = extension.runtime.lastError
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }
}

function isEmpty(obj) {
  return Object.keys(obj).length === 0
}
