// next version number
const version = 29
const failTxsThat = require('./fail-tx')

// time
const seconds = 1000
const minutes = 60 * seconds
const hours = 60 * minutes
const unacceptableDelay = 12 * hours

/*

normalizes txParams on unconfirmed txs

*/

module.exports = {
  version,

  migrate: failTxsThat(version, 'Stuck in approved state for too long.', (txMeta) => {
    const isApproved = txMeta.status === 'approved'
    const createdTime = txMeta.submittedTime
    const now = Date.now()
    return isApproved && now - createdTime > unacceptableDelay
  }),
}

