const extension = require('extensionizer')

const KEYS_TO_SYNC = ['KeyringController', 'PreferencesController']
const FIREFOX_SYNC_DISABLED_MESSAGE = 'Please set webextensions.storage.sync.enabled to true in about:config'

const handleDisabledSyncAndResolve = (resolve, toResolve) => {
  // Firefox 52 has sync available on extension.storage, but it is disabled by default
  const lastError = extension.runtime.lastError
  if (lastError && lastError.message.includes(FIREFOX_SYNC_DISABLED_MESSAGE)) {
    resolve({})
  } else {
    resolve(toResolve)
  }
}

module.exports = class ExtensionStore {
  async fetch() {
    return new Promise((resolve) => {
      extension.storage.sync.get(KEYS_TO_SYNC, (data) => {
        handleDisabledSyncAndResolve(resolve, data)
      })
    })
  }
  async sync(state) {
    const dataToSync = KEYS_TO_SYNC.reduce((result, key) => {
      result[key] = state.data[key]
      return result
    }, {})
    return new Promise((resolve) => {
      extension.storage.sync.set(dataToSync, () => {
        handleDisabledSyncAndResolve(resolve)
      })
    })
  }
}
