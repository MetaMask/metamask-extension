const ObservableStore = require('obs-store')
const clone = require('clone')
const ConfigManager = require('../../app/scripts/lib/config-manager')
const firstTimeState = require('../../app/scripts/first-time-state')

module.exports = function () {
  const store = new ObservableStore(clone(firstTimeState))
  return new ConfigManager({ store })
}
