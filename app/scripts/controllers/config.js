/* The config-controller is a controller for storing assorted orphaned config values.
 * These values should maybe live somewhere else, but for now, they just live here.
 */

const ObservableStore = require('obs-store')

module.exports = ConfigController
function ConfigController (opts) {
  this.store = new ObservableStore(opts.initState)
}

ConfigController.prototype.getConfig = function () {
  var data = this.getData()
  return data.config
}

ConfigController.prototype.setData = function (data) {
  this.store.updateState(data)
}

ConfigController.prototype.getData = function () {
  return this.store.getState()
}

ConfigController.prototype.setPasswordForgotten = function (passwordForgottenState) {
  const data = this.getData()
  data.forgottenPassword = passwordForgottenState
  this.setData(data)
}

ConfigController.prototype.setSeedWords = function (words) {
  var data = this.getData()
  data.seedWords = words
  this.setData(data)
}

