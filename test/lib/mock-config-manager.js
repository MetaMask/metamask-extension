const ObservableStore = require('obs-store')
const clone = require('clone')
const ConfigManager = require('../../app/scripts/lib/config-manager')
const firstTimeState = require('../../app/scripts/first-time-state')
const STORAGE_KEY = 'metamask-config'

module.exports = function() {
  let store = new ObservableStore(clone(firstTimeState))
  return new ConfigManager({ store })
}