const valuesFor = require('../app/util').valuesFor

module.exports = function (unapprovedTxs, unapprovedMsgs, personalMsgs, network) {
  log.debug('tx-helper called with params:')
  log.debug({ unapprovedTxs, unapprovedMsgs, personalMsgs, network })

  const txValues = network ? valuesFor(unapprovedTxs).filter(tx => tx.txParams.metamaskNetworkId === network) : valuesFor(unapprovedTxs)
  log.debug(`tx helper found ${txValues.length} unapproved txs`)
  const msgValues = valuesFor(unapprovedMsgs)
  log.debug(`tx helper found ${msgValues.length} unsigned messages`)
  let allValues = txValues.concat(msgValues)
  const personalValues = valuesFor(personalMsgs)
  allValues = allValues.concat(personalValues)

  return allValues.sort(tx => tx.time)
}
