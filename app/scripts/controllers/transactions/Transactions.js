const OriginalTransaction = require('js-conflux-sdk/src/Transaction')

// TODO: remove this layer if js-conflux-sdk compatible with checksumed address
class Transaction extends OriginalTransaction {
  constructor (txParams) {
    if (typeof txParams.to === 'string' && txParams.to.startsWith('0x')) {
      txParams.to = txParams.to.toLowerCase()
    }
    super(txParams)
  }
}

module.exports = Transaction
