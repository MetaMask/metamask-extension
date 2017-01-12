const ConfigManager = require('../../app/scripts/lib/config-manager')
const LocalStorageStore = require('../../app/scripts/lib/observable/local-storage')
const firstTimeState = require('../../app/scripts/first-time-state')
const STORAGE_KEY = 'metamask-config'

module.exports = function() {
  let dataStore = new LocalStorageStore({ storageKey: STORAGE_KEY })
  // initial state for first time users
  if (!dataStore.get()) dataStore.put(firstTimeState)
  return new ConfigManager({ store: dataStore })
}