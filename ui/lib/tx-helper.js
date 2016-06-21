const valuesFor = require('../app/util').valuesFor

module.exports = function (unconfTxs, unconfMsgs) {
  var txValues = valuesFor(unconfTxs)
  var msgValues = valuesFor(unconfMsgs)
  var allValues = txValues.concat(msgValues)
  return allValues.sort(tx => tx.time)
}
