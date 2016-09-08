const valuesFor = require('../app/util').valuesFor

module.exports = function (unconfTxs, unconfMsgs, network) {
  var txValues = network ? valuesFor(unconfTxs).filter(tx => tx.txParams.metamaskNetworkId === network) : valuesFor(unconfTxs)
  var msgValues = valuesFor(unconfMsgs)
  var allValues = txValues.concat(msgValues)
  return allValues.sort(tx => tx.time)
}
