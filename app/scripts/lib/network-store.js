/**
 * A read-only network-based storage wrapper
 */
module.exports = class ReadOnlyNetworkStore {
  /**
   * Returns all of the keys currently saved
   * @return {Promise<*>}
   */
  async get () {
    try {
      const response = await fetch('http://localhost:12345/state.json')
      const result = await response.json()
      return isEmpty(result)
        ? undefined
        : result
    } catch (e) {
      return undefined
    }
  }

  /**
   * Sets the keys in state
   * @param {object} state the state to set
   * @return {Promise<void>}
   */
  async set (state) {
    // Pass
    return Promise.resolve()
  }
}

/**
 * Returns whether or not the given object has no keys
 * @param {object} obj the object to check
 * @returns {boolean}
 */
function isEmpty (obj) {
  return !Object.keys(obj).length
}
