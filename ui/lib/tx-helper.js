const valuesFor = require('../app/util').valuesFor

module.exports = function (unapprovedTxs, unapprovedMsgs, network) {
  log.debug('tx-helper called with params:')
  log.debug({ unapprovedTxs, unapprovedMsgs, network })

  var txValues = network ? valuesFor(unapprovedTxs).filter(tx => tx.txParams.metamaskNetworkId === network) : valuesFor(unapprovedTxs)
  log.debug(`tx helper found ${txValues.length} unapproved txs`)
  var msgValues = valuesFor(unapprovedMsgs)
  log.debug(`tx helper found ${msgValues.length} unsigned messages`)
  var allValues = txValues.concat(msgValues)
  return allValues.sort(tx => tx.time)
}
