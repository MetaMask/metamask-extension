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

  analyzeGasUsage (txMeta, cb) {
    var self = this
    this.query.getBlockByNumber('latest', true, (err, block) => {
      if (err) return cb(err)
      async.waterfall([
        self.estimateTxGas.bind(self, txMeta, block.gasLimit),
        self.setTxGas.bind(self, txMeta, block.gasLimit),
      ], cb)
    })
  }

  estimateTxGas (txMeta, blockGasLimitHex, cb) {
    const txParams = txMeta.txParams
    // check if gasLimit is already specified
    txMeta.gasLimitSpecified = Boolean(txParams.gas)
    // if not, fallback to block gasLimit
    if (!txMeta.gasLimitSpecified) {
      txParams.gas = blockGasLimitHex
    }
    // run tx, see if it will OOG
    this.query.estimateGas(txParams, cb)
  }

  setTxGas (txMeta, blockGasLimitHex, estimatedGasHex, cb) {
    txMeta.estimatedGas = estimatedGasHex
    const txParams = txMeta.txParams

    // if gasLimit was specified and doesnt OOG,
    // use original specified amount
    if (txMeta.gasLimitSpecified) {
      txMeta.estimatedGas = txParams.gas
      cb()
      return
    }
    // if gasLimit not originally specified,
    // try adding an additional gas buffer to our estimation for safety
    const recommendedGasHex = this.addGasBuffer(txMeta.estimatedGas, blockGasLimitHex)
    txParams.gas = recommendedGasHex
    cb()
    return
  }

  addGasBuffer (initialGasLimitHex, blockGasLimitHex) {
    const initialGasLimitBn = hexToBn(initialGasLimitHex)
    const blockGasLimitBn = hexToBn(blockGasLimitHex)
    const upperGasLimitBn = blockGasLimitBn.muln(0.9)
    const bufferedGasLimitBn = initialGasLimitBn.muln(1.5)

    // if initialGasLimit is above blockGasLimit, dont modify it
    if (initialGasLimitBn.gt(upperGasLimitBn)) return bnToHex(initialGasLimitBn)
    // if bufferedGasLimit is below blockGasLimit, use bufferedGasLimit
    if (bufferedGasLimitBn.lt(upperGasLimitBn)) return bnToHex(bufferedGasLimitBn)
    // otherwise use blockGasLimit
    return bnToHex(upperGasLimitBn)
  }

  fillInTxParams (txParams, cb) {
    const fromAddress = txParams.from
    const reqs = {}

    if (isUndef(txParams.gas)) reqs.gas = (cb) => this.query.estimateGas(txParams, cb)
    if (isUndef(txParams.gasPrice)) reqs.gasPrice = (cb) => this.query.gasPrice(cb)
    if (isUndef(txParams.nonce)) reqs.nonce = (cb) => this.query.getTransactionCount(fromAddress, 'pending', cb)

    async.parallel(reqs, function (err, result) {
      if (err) return cb(err)
      // write results to txParams obj
      Object.assign(txParams, result)
      cb()
    })
  }

  // builds ethTx from txParams object
  buildEthTxFromParams (txParams) {
    // normalize values
    txParams.to = normalize(txParams.to)
    txParams.from = normalize(txParams.from)
    txParams.value = normalize(txParams.value)
    txParams.data = normalize(txParams.data)
    txParams.gas = normalize(txParams.gas || txParams.gasLimit)
    txParams.gasPrice = normalize(txParams.gasPrice)
    txParams.nonce = normalize(txParams.nonce)
    // build ethTx
    log.info(`Prepared tx for signing: ${JSON.stringify(txParams)}`)
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

function isUndef (value) {
  return value === undefined
}

function bnToHex (inputBn) {
  return ethUtil.addHexPrefix(inputBn.toString(16))
}

function hexToBn (inputHex) {
  return new BN(ethUtil.stripHexPrefix(inputHex), 16)
}
