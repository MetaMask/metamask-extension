const EthQuery = require('ethjs-query')
const {
  hexToBn,
  BnMultiplyByFraction,
  bnToHex,
} = require('../../lib/util')
const { addHexPrefix } = require('ethereumjs-util')
const SIMPLE_GAS_COST = '0x5208' // Hex for 21000, cost of a simple send.

import { TRANSACTION_NO_CONTRACT_ERROR_KEY } from '../../../../ui/app/constants/error-keys'

/**
tx-gas-utils are gas utility methods for Transaction manager
its passed ethquery
and used to do things like calculate gas of a tx.
@param {Object} provider - A network provider.
*/

class TxGasUtil {

  constructor (provider) {
    this.query = new EthQuery(provider)
  }

  /**
    @param txMeta {Object} - the txMeta object
    @returns {object} the txMeta object with the gas written to the txParams
  */
  async analyzeGasUsage (txMeta) {
    const block = await this.query.getBlockByNumber('latest', false)
    let estimatedGasHex
    try {
      estimatedGasHex = await this.estimateTxGas(txMeta, block.gasLimit)
    } catch (err) {
      txMeta.simulationFails = {
        reason: err.message,
        errorKey: err.errorKey,
      }
      return txMeta
    }
    this.setTxGas(txMeta, block.gasLimit, estimatedGasHex)
    return txMeta
  }

  /**
    Estimates the tx's gas usage
    @param txMeta {Object} - the txMeta object
    @param blockGasLimitHex {string} - hex string of the block's gas limit
    @returns {string} the estimated gas limit as a hex string
  */
  async estimateTxGas (txMeta, blockGasLimitHex) {
    const txParams = txMeta.txParams

    // check if gasLimit is already specified
    txMeta.gasLimitSpecified = Boolean(txParams.gas)

    // if it is, use that value
    if (txMeta.gasLimitSpecified) {
      return txParams.gas
    }

    const recipient = txParams.to
    const hasRecipient = Boolean(recipient)

    if (hasRecipient) {
      let code = await this.query.getCode(recipient)

      // If there's data in the params, but there's no code, it's not a valid contract
      // For no code, Infura will return '0x', and Ganache will return '0x0'
      if (txParams.data && (!code || code === '0x' || code === '0x0')) {
        throw {errorKey: TRANSACTION_NO_CONTRACT_ERROR_KEY}
      }
      else if (!code) {
        txParams.gas = SIMPLE_GAS_COST // For a standard ETH send, gas is 21k max
        txMeta.simpleSend = true // Prevents buffer addition
        return SIMPLE_GAS_COST
      }
    }

    // if not, fall back to block gasLimit
    const blockGasLimitBN = hexToBn(blockGasLimitHex)
    const saferGasLimitBN = BnMultiplyByFraction(blockGasLimitBN, 19, 20)
    txParams.gas = bnToHex(saferGasLimitBN)

    // run tx
    return await this.query.estimateGas(txParams)
  }

  /**
    Writes the gas on the txParams in the txMeta
    @param txMeta {Object} - the txMeta object to write to
    @param blockGasLimitHex {string} - the block gas limit hex
    @param estimatedGasHex {string} - the estimated gas hex
  */
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

  /**
    Adds a gas buffer with out exceeding the block gas limit

    @param initialGasLimitHex {string} - the initial gas limit to add the buffer too
    @param blockGasLimitHex {string} - the block gas limit
    @returns {string} the buffered gas limit as a hex string
  */
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
}

module.exports = TxGasUtil
