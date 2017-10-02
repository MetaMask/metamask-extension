const EthQuery = require('ethjs-query')
const {
  hexToBn,
  BnMultiplyByFraction,
  bnToHex,
} = require('./util')

/*
tx-utils are utility methods for Transaction manager
its passed ethquery
and used to do things like calculate gas of a tx.
*/

module.exports = class txProvideUtil {
  constructor (provider) {
    this.query = new EthQuery(provider)
  }

  async analyzeGasUsage (txMeta) {
    const block = await this.query.getBlockByNumber('latest', true)
    let estimatedGasHex
    try {
      estimatedGasHex = await this.estimateTxGas(txMeta, block.gasLimit)
    } catch (err) {
      if (err.message.includes('Transaction execution error.')) {
        txMeta.simulationFails = true
        return txMeta
      }
    }
    this.setTxGas(txMeta, block.gasLimit, estimatedGasHex)
    return txMeta
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
    // run tx
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

  async validateTxParams (txParams) {
    if (('value' in txParams) && txParams.value.indexOf('-') === 0) {
      throw new Error(`Invalid transaction value of ${txParams.value} not a positive number.`)
    }
  }
}