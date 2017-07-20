const valuesFor = require('../app/util').valuesFor

module.exports = function (unapprovedTxs, unapprovedMsgs, personalMsgs, network) {
  log.debug('tx-helper called with params:')
  log.debug({ unapprovedTxs, unapprovedMsgs, personalMsgs, network })

  const txValues = network ? valuesFor(unapprovedTxs).filter(txMeta => txMeta.metamaskNetworkId === network) : valuesFor(unapprovedTxs)
  log.debug(`tx helper found ${txValues.length} unapproved txs`)
  const msgValues = valuesFor(unapprovedMsgs)
  log.debug(`tx helper found ${msgValues.length} unsigned messages`)
  let allValues = txValues.concat(msgValues)
  const personalValues = valuesFor(personalMsgs)
  log.debug(`tx helper found ${personalValues.length} unsigned personal messages`)
  allValues = allValues.concat(personalValues)
  allValues = allValues.sort((a, b) => {
    return a.time > b.time
  })

  return allValues
}

