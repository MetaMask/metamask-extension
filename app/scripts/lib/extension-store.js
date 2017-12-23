const extension = require('extensionizer')

const KEYS_TO_SYNC = ['KeyringController', 'PreferencesController']

module.exports = class ExtensionStore {
  async fetch() {
    return new Promise((resolve) => {
      extension.storage.sync.get(KEYS_TO_SYNC, data => resolve(data))
    })
  }
  async sync(state) {
    const dataToSync = KEYS_TO_SYNC.reduce((result, key) => {
      result[key] = state.data[key]
      return result
    }, {})
    return new Promise((resolve) => {
      extension.storage.sync.set(dataToSync, () => resolve())
    })
  }
}
