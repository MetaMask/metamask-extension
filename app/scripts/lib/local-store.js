const extension = require('extensionizer')
const log = require('loglevel')
const { checkForError } = require('./util')

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
    if (!this.isSupported) {
      return undefined
    }
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
