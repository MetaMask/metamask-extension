const EthQuery = require('ethjs-query')
const {
  hexToBn,
  BnMultiplyByFraction,
  bnToHex,
} = require('./util')
const {addHexPrefix, isValidAddress} = require('ethereumjs-util')
const SIMPLE_GAS_COST = '0x5208' // Hex for 21000, cost of a simple send.

/*
tx-utils are utility methods for Transaction manager
its passed ethquery
and used to do things like calculate gas of a tx.
*/

module.exports = class TxGasUtil {

  constructor (provider) {
    this.query = new EthQuery(provider)
  }

  async analyzeGasUsage (txMeta) {
    const block = await this.query.getBlockByNumber('latest', true)
    let estimatedGasHex
    try {
      estimatedGasHex = await this.estimateTxGas(txMeta, block.gasLimit)
    } catch (err) {
      const simulationFailed = (
        err.message.includes('Transaction execution error.') ||
        err.message.includes('gas required exceeds allowance or always failing transaction')
      )
      if (simulationFailed) {
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

    // if it is, use that value
    if (txMeta.gasLimitSpecified) {
      return txParams.gas
    }

    // if recipient has no code, gas is 21k max:
    const recipient = txParams.to
    const hasRecipient = Boolean(recipient)
    const code = await this.query.getCode(recipient)
    if (hasRecipient && (!code || code === '0x')) {
      txParams.gas = SIMPLE_GAS_COST
      txMeta.simpleSend = true // Prevents buffer addition
      return SIMPLE_GAS_COST
    }

    // if not, fall back to block gasLimit
    const blockGasLimitBN = hexToBn(blockGasLimitHex)
    const saferGasLimitBN = BnMultiplyByFraction(blockGasLimitBN, 19, 20)
    txParams.gas = bnToHex(saferGasLimitBN)

    // run tx
    return await this.query.estimateGas(txParams)
  }

  setTxGas (txMeta, blockGasLimitHex, estimatedGasHex) {
    txMeta.estimatedGas = addHexPrefix(estimatedGasHex)
    const txParams = txMeta.txParams

    // if gasLimit was specified and doesnt OOG,
    // use original specified amount
    if (txMeta.gasLimitSpecified || txMeta.simpleSend) {
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
    this.validateRecipient(txParams)
    if ('to' in txParams) {
      if ( txParams.to === null ) delete txParams.to
      else if ( txParams.to !== undefined && !isValidAddress(txParams.to) ) {
        throw new Error(`Invalid recipient address`)
      }
    }
    if ('value' in txParams) {
      const value = txParams.value.toString()
      if (value.includes('-')) {
        throw new Error(`Invalid transaction value of ${txParams.value} not a positive number.`)
      }

      if (value.includes('.')) {
        throw new Error(`Invalid transaction value of ${txParams.value} number must be in wei`)
      }
    }
  }
  validateRecipient (txParams) {
    if (txParams.to === '0x') {
      if (txParams.data) {
        delete txParams.to
      } else {
        throw new Error('Invalid recipient address')
      }
    }
    return txParams
  }
}
