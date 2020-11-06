const OriginalEthQuery = require('eth-query')

class EthQuery extends OriginalEthQuery {}

EthQuery.prototype.blockNumber = generateFnFor('eth_epochNumber')
EthQuery.prototype.getUncleCountByBlockNumber = generateFnFor(
  'eth_getUncleCountByEpochNumber'
)
EthQuery.prototype.getTransactionByBlockNumberAndIndex = generateFnFor(
  'eth_getTransactionByEpochNumberAndIndex'
)
EthQuery.prototype.getUncleByBlockNumberAndIndex = generateFnFor(
  'eth_getUncleByEpochNumberAndIndex'
)

function generateFnFor(methodName) {
  return function() {
    const self = this
    const args = [].slice.call(arguments)
    const cb = args.pop()
    self.sendAsync(
      {
        method: methodName,
        params: args,
      },
      cb
    )
  }
}

module.exports = EthQuery
