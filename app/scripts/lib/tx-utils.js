const async = require('async')
const ethUtil = require('ethereumjs-util')
const Transaction = require('ethereumjs-tx')
const normalize = require('eth-sig-util').normalize
const BN = ethUtil.BN

/*
tx-utils are utility methods for Transaction manager
its passed ethquery
and used to do things like calculate gas of a tx.
*/

module.exports = class txProvideUtils {
  constructor (ethQuery) {
    this.query = ethQuery
  }

  async analyzeGasUsage (txMeta) {
    const block = await this.query.getBlockByNumber('latest', true)
    const estimatedGasHex = await this.estimateTxGas(txMeta, block.gasLimit)
    this.setTxGas(txMeta, block.gasLimit, estimatedGasHex)
  }

  async estimateTxGas (txMeta, blockGasLimitHex) {
    const txParams = txMeta.txParams
    // check if gasLimit is already specified
    txMeta.gasLimitSpecified = Boolean(txParams.gas)
    // if not, fallback to block gasLimit
    if (!txMeta.gasLimitSpecified) {
      const blockGasLimitBN = hexToBn(blockGasLimitHex)
      const saferGasLimitBN = BnMultiplyByFraction(blockGasLimitBN, 19, 20)
      txParams.gas = bnToHex(saferGasLimitBN)
    }
    // run tx, see if it will OOG
    return await this.query.estimateGas(txParams)
  }

  setTxGas (txMeta, blockGasLimitHex, estimatedGasHex) {
    txMeta.estimatedGas = estimatedGasHex
    const txParams = txMeta.txParams

    // if gasLimit was specified and doesnt OOG,
    // use original specified amount
    if (txMeta.gasLimitSpecified) {
      txMeta.estimatedGas = txParams.gas
      return
    }
    // if gasLimit not originally specified,
    // try adding an additional gas buffer to our estimation for safety
    const recommendedGasHex = this.addGasBuffer(txMeta.estimatedGas, blockGasLimitHex)
    txParams.gas = recommendedGasHex
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

  publishTransaction (rawTx) {
    return this.query.sendRawTransaction(rawTx)
  }

  validateTxParams (txParams) {
    return new Promise ((resolve, reject) => {
      if (('value' in txParams) && txParams.value.indexOf('-') === 0) {
        reject(new Error(`Invalid transaction value of ${txParams.value} not a positive number.`))
      } else {
        resolve()
      }
    })
  }

  sufficientBalance (txParams, hexBalance) {
    const balance = hexToBn(hexBalance)
    const value = hexToBn(txParams.value)
    const gasLimit = hexToBn(txParams.gas)
    const gasPrice = hexToBn(txParams.gasPrice)

    const maxCost = value.add(gasLimit.mul(gasPrice))
    return balance.gte(maxCost)
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

function BnMultiplyByFraction (targetBN, numerator, denominator) {
  const numBN = new BN(numerator)
  const denomBN = new BN(denominator)
  return targetBN.mul(numBN).div(denomBN)
}
