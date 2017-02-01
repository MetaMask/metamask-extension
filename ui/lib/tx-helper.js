const valuesFor = require('../app/util').valuesFor

module.exports = function (unapprovedTxs, unapprovedMsgs, network) {
  var txValues = network ? valuesFor(unapprovedTxs).filter(tx => tx.txParams.metamaskNetworkId === network) : valuesFor(unapprovedTxs)
  var msgValues = valuesFor(unapprovedMsgs)
  var allValues = txValues.concat(msgValues)
  return allValues.sort(tx => tx.time)
}
