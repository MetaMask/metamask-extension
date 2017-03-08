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
    const recommendedGasHex = this.addGasBuffer(txData.estimatedGas, blockGasLimitHex)
    txParams.gas = recommendedGasHex
    cb()
    return
  }

  addGasBuffer (initialGasLimitHex, blockGasLimitHex) {
    const initialGasLimitBn = hexToBn(initialGasLimitHex)
    const blockGasLimitBn = hexToBn(blockGasLimitHex)
    const bufferedGasLimitBn = initialGasLimitBn.muln(1.5)
    
    // if initialGasLimit is above blockGasLimit, dont modify it
    if (initialGasLimitBn.gt(blockGasLimitBn)) return bnToHex(initialGasLimitBn)
    // if bufferedGasLimit is below blockGasLimit, use bufferedGasLimit
    if (bufferedGasLimitBn.lt(blockGasLimitBn)) return bnToHex(bufferedGasLimitBn)
    // otherwise use blockGasLimit
    return bnToHex(blockGasLimitBn)
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
  buildEthTxFromParams (txParams) {
    // apply gas multiplyer
    let gasPrice = new BN(ethUtil.stripHexPrefix(txParams.gasPrice), 16)
    // multiply and divide by 100 so as to add percision to integer mul
    txParams.gasPrice = ethUtil.intToHex(gasPrice.toNumber())
    // normalize values
    txParams.to = normalize(txParams.to)
    txParams.from = normalize(txParams.from)
    txParams.value = normalize(txParams.value)
    txParams.data = normalize(txParams.data)
    txParams.gasLimit = normalize(txParams.gasLimit || txParams.gas)
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

function isUndef(value) {
  return value === undefined
}

function bnToHex(inputBn) {
  return ethUtil.addHexPrefix(inputBn.toString(16))
}

function hexToBn(inputHex) {
  return new BN(ethUtil.stripHexPrefix(inputHex), 16)
}