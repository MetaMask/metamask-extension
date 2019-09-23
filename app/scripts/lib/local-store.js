const extension = require('extensionizer')
const log = require('loglevel')

/**
 * A wrapper around the extension's storage local API
 */
module.exports = class ExtensionStore {
  /**
   * @constructor
   */
  constructor () {
    this.isSupported = !!(extension.storage.local)
    if (!this.isSupported) {
      log.error('Storage local API not available.')
    }
  }

  /**
   * Returns all of the keys currently saved
   * @return {Promise<*>}
   */
  async get () {
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

  /**
   * Sets the key in local state
   * @param {object} state - The state to set
   * @return {Promise<void>}
   */
  async set (state) {
    return this._set(state)
  }

  /**
   * Returns all of the keys currently saved
   * @private
   * @return {object} the key-value map from local storage
   */
  _get () {
    const local = extension.storage.local
    return new Promise((resolve, reject) => {
      local.get(null, (/** @type {any} */ result) => {
        const err = checkForError()
        if (err) {
          reject(err)
        } else {
          resolve(result)
        }
      })
    })
  }

  /**
   * Sets the key in local state
   * @param {object} obj - The key to set
   * @return {Promise<void>}
   * @private
   */
  _set (obj) {
    const local = extension.storage.local
    return new Promise((resolve, reject) => {
      local.set(obj, () => {
        const err = checkForError()
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }
}

/**
 * Returns whether or not the given object contains no keys
 * @param {object} obj - The object to check
 * @returns {boolean}
 */
function isEmpty (obj) {
  return Object.keys(obj).length === 0
}

/**
 * Returns an Error if extension.runtime.lastError is present
 * this is a workaround for the non-standard error object thats used
 * @returns {Error}
 */
function checkForError () {
  const lastError = extension.runtime.lastError
  if (!lastError) return
  // if it quacks like an Error, its an Error
  if (lastError.stack && lastError.message) return lastError
  // repair incomplete error object (eg chromium v77)
  return new Error(lastError.message)
}
