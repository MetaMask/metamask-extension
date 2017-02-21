const async = require('async')
const EthQuery = require('eth-query')
const ethUtil = require('ethereumjs-util')
const Transaction = require('ethereumjs-tx')
const normalize = require('eth-sig-util').normalize
const BN = ethUtil.BN

/*
tx-utils are utility methods for Transaction manager
its passed a provider and that is passed to ethquery
and used to do things like calculate gas of a tx.
*/

module.exports = class txProviderUtils {
  constructor (provider) {
    this.provider = provider
    this.query = new EthQuery(provider)
  }

  analyzeGasUsage (txData, cb) {
    var self = this
    this.query.getBlockByNumber('latest', true, (err, block) => {
      if (err) return cb(err)
      async.waterfall([
        self.estimateTxGas.bind(self, txData, block.gasLimit),
        self.setTxGas.bind(self, txData, block.gasLimit),
      ], cb)
    })
  }

  estimateTxGas (txData, blockGasLimitHex, cb) {
    const txParams = txData.txParams
    // check if gasLimit is already specified
    txData.gasLimitSpecified = Boolean(txParams.gas)
    // if not, fallback to block gasLimit
    if (!txData.gasLimitSpecified) {
      txParams.gas = blockGasLimitHex
    }
    // run tx, see if it will OOG
    this.query.estimateGas(txParams, cb)
  }

  setTxGas (txData, blockGasLimitHex, estimatedGasHex, cb) {
    txData.estimatedGas = estimatedGasHex
    const txParams = txData.txParams

    // if gasLimit was specified and doesnt OOG,
    // use original specified amount
    if (txData.gasLimitSpecified) {
      txData.estimatedGas = txParams.gas
      cb()
      return
    }
    // if gasLimit not originally specified,
    // try adding an additional gas buffer to our estimation for safety
    const estimatedGasBn = new BN(ethUtil.stripHexPrefix(txData.estimatedGas), 16)
    const blockGasLimitBn = new BN(ethUtil.stripHexPrefix(blockGasLimitHex), 16)
    const estimationWithBuffer = new BN(this.addGasBuffer(estimatedGasBn), 16)
    // added gas buffer is too high
    if (estimationWithBuffer.gt(blockGasLimitBn)) {
      txParams.gas = txData.estimatedGas
    // added gas buffer is safe
    } else {
      const gasWithBufferHex = ethUtil.intToHex(estimationWithBuffer)
      txParams.gas = gasWithBufferHex
    }
    cb()
    return
  }

  addGasBuffer (gas) {
    const gasBuffer = new BN('100000', 10)
    const bnGas = new BN(ethUtil.stripHexPrefix(gas), 16)
    const correct = bnGas.add(gasBuffer)
    return ethUtil.addHexPrefix(correct.toString(16))
  }

  fillInTxParams (txParams, cb) {
    let fromAddress = txParams.from
    let reqs = {}

    if (isUndef(txParams.gas)) reqs.gas = (cb) => this.query.estimateGas(txParams, cb)
    if (isUndef(txParams.gasPrice)) reqs.gasPrice = (cb) => this.query.gasPrice(cb)
    if (isUndef(txParams.nonce)) reqs.nonce = (cb) => this.query.getTransactionCount(fromAddress, 'pending', cb)

    async.parallel(reqs, function(err, result) {
      if (err) return cb(err)
      // write results to txParams obj
      Object.assign(txParams, result)
      cb()
    })
  }

  // builds ethTx from txParams object
  buildEthTxFromParams (txParams, gasMultiplier = 1) {
    // apply gas multiplyer
    let gasPrice = new BN(ethUtil.stripHexPrefix(txParams.gasPrice), 16)
    // multiply and divide by 100 so as to add percision to integer mul
    gasPrice = gasPrice.mul(new BN(gasMultiplier * 100, 10)).div(new BN(100, 10))
    txParams.gasPrice = ethUtil.intToHex(gasPrice.toNumber())
    // normalize values
    txParams.to = normalize(txParams.to)
    txParams.from = normalize(txParams.from)
    txParams.value = normalize(txParams.value)
    txParams.data = normalize(txParams.data)
    txParams.gasLimit = normalize(txParams.gasLimit || txParams.gas)
    txParams.nonce = normalize(txParams.nonce)
    // build ethTx
    const ethTx = new Transaction(txParams)
    return ethTx
  }

  publishTransaction (rawTx, cb) {
    this.query.sendRawTransaction(rawTx, cb)
  }

  validateTxParams (txParams, cb) {
    if (('value' in txParams) && txParams.value.indexOf('-') === 0) {
      cb(new Error(`Invalid transaction value of ${txParams.value} not a positive number.`))
    } else {
      cb()
    }
  }


}

// util

function isUndef(value) {
  return value === undefined
}
