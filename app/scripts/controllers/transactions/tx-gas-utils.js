import EthQuery from 'ethjs-query'
import { hexToBn, BnMultiplyByFraction, bnToHex } from '../../lib/util'
import log from 'loglevel'
import { addHexPrefix } from 'ethereumjs-util'

/**
 * Result of gas analysis, including either a gas estimate for a successful analysis, or
 * debug information for a failed analysis.
 * @typedef {Object} GasAnalysisResult
 * @property {string} blockGasLimit - The gas limit of the block used for the analysis
 * @property {string} estimatedGasHex - The estimated gas, in hexidecimal
 * @property {Object} simulationFails - Debug information about why an analysis failed
 */

/**
tx-gas-utils are gas utility methods for Transaction manager
its passed ethquery
and used to do things like calculate gas of a tx.
@param {Object} provider - A network provider.
*/

export default class TxGasUtil {

  constructor (provider) {
    this.query = new EthQuery(provider)
  }

  /**
    @param {Object} txMeta - the txMeta object
    @returns {GasAnalysisResult} The result of the gas analysis
  */
  async analyzeGasUsage (txMeta) {
    const block = await this.query.getBlockByNumber('latest', false)
    let estimatedGasHex
    let simulationFails
    try {
      estimatedGasHex = await this.estimateTxGas(txMeta, block.gasLimit)
    } catch (err) {
      log.warn(err)
      simulationFails = {
        reason: err.message,
        errorKey: err.errorKey,
        debug: { blockNumber: block.number, blockGasLimit: block.gasLimit },
      }
    }

    return { blockGasLimit: block.gasLimit, estimatedGasHex, simulationFails }
  }

  /**
    Estimates the tx's gas usage
    @param {Object} txMeta - the txMeta object
    @param {string} blockGasLimitHex - hex string of the block's gas limit
    @returns {string} - the estimated gas limit as a hex string
  */
  async estimateTxGas (txMeta, blockGasLimitHex) {
    const txParams = txMeta.txParams

    // fallback to block gasLimit
    const blockGasLimitBN = hexToBn(blockGasLimitHex)
    const saferGasLimitBN = BnMultiplyByFraction(blockGasLimitBN, 19, 20)
    txParams.gas = bnToHex(saferGasLimitBN)

    // estimate tx gas requirements
    return await this.query.estimateGas(txParams)
  }

  /**
    Writes the gas on the txParams in the txMeta
    @param {Object} txMeta - the txMeta object to write to
    @param {string} blockGasLimitHex - the block gas limit hex
    @param {string} estimatedGasHex - the estimated gas hex
  */
  setTxGas (txMeta, blockGasLimitHex, estimatedGasHex) {
    const txParams = txMeta.txParams

    // if gasLimit not originally specified,
    // try adding an additional gas buffer to our estimation for safety
    const recommendedGasHex = this.addGasBuffer(addHexPrefix(estimatedGasHex), blockGasLimitHex)
    txParams.gas = recommendedGasHex
    return
  }

  /**
    Adds a gas buffer with out exceeding the block gas limit

    @param {string} initialGasLimitHex - the initial gas limit to add the buffer too
    @param {string} blockGasLimitHex - the block gas limit
    @returns {string} - the buffered gas limit as a hex string
  */
  addGasBuffer (initialGasLimitHex, blockGasLimitHex) {
    const initialGasLimitBn = hexToBn(initialGasLimitHex)
    const blockGasLimitBn = hexToBn(blockGasLimitHex)
    const upperGasLimitBn = blockGasLimitBn.muln(0.9)
    const bufferedGasLimitBn = initialGasLimitBn.muln(1.5)

    // if initialGasLimit is above blockGasLimit, dont modify it
    if (initialGasLimitBn.gt(upperGasLimitBn)) {
      return bnToHex(initialGasLimitBn)
    }
    // if bufferedGasLimit is below blockGasLimit, use bufferedGasLimit
    if (bufferedGasLimitBn.lt(upperGasLimitBn)) {
      return bnToHex(bufferedGasLimitBn)
    }
    // otherwise use blockGasLimit
    return bnToHex(upperGasLimitBn)
  }
}
