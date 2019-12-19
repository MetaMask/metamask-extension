const EthQuery = require("eth-query");

EthQuery.prototype.blockNumber = generateFnFor("eth_epochNumber");
EthQuery.prototype.getUncleCountByBlockNumber = generateFnFor(
  "eth_getUncleCountByEpochNumber"
);
EthQuery.prototype.getTransactionByBlockNumberAndIndex = generateFnFor(
  "eth_getTransactionByEpochNumberAndIndex"
);
EthQuery.prototype.getUncleByBlockNumberAndIndex = generateFnFor(
  "eth_getUncleByEpochNumberAndIndex"
);

function generateFnFor(methodName) {
  return function() {
    const self = this;
    var args = [].slice.call(arguments);
    var cb = args.pop();
    self.sendAsync(
      {
        method: methodName,
        params: args
      },
      cb
    );
  };
}

module.exports = EthQuery;
