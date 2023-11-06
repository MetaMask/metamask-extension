import EthQuery from '@metamask/ethjs-query';
import log from 'loglevel';
import { addHexPrefix } from 'ethereumjs-util';
import { cloneDeep } from 'lodash';
import { hexToBn, BnMultiplyByFraction } from '../../lib/util';
import { bnToHex } from '../../../../shared/modules/conversion.utils';

/**
 * Result of gas analysis, including either a gas estimate for a successful analysis, or
 * debug information for a failed analysis.
 *
 * @typedef {object} GasAnalysisResult
 * @property {string} blockGasLimit - The gas limit of the block used for the analysis
 * @property {string} estimatedGasHex - The estimated gas, in hexadecimal
 * @property {object} simulationFails - Debug information about why an analysis failed
 */

/**
 * tx-gas-utils are gas utility methods for Transaction manager
 * its passed ethquery
 * and used to do things like calculate gas of a tx.
 *
 * @param {object} provider - A network provider.
 */

export default class TxGasUtil {
  constructor(provider, { getNetworkClientById } = {}) {
    this.getNetworkClientById = getNetworkClientById;
    this.query = new EthQuery(provider);
  }

  /**
   * @param {object} txMeta - the txMeta object
   * @param {string} networkClientId - the network client id
   * @returns {GasAnalysisResult} The result of the gas analysis
   */
  async analyzeGasUsage(txMeta, { networkClientId } = {}) {
    let { query } = this;
    if (networkClientId) {
      const { provider } = this.getNetworkClientById(networkClientId);
      query = new EthQuery(provider);
    }

    const block = await query.getBlockByNumber('latest', false);

    // fallback to block gasLimit
    const blockGasLimitBN = hexToBn(block.gasLimit);
    const saferGasLimitBN = BnMultiplyByFraction(blockGasLimitBN, 19, 20);
    let estimatedGasHex = bnToHex(saferGasLimitBN);
    let simulationFails;
    try {
      estimatedGasHex = await this._estimateTxGas(txMeta, { query });
    } catch (error) {
      log.warn(error);
      simulationFails = {
        reason: error.message,
        errorKey: error.errorKey,
        debug: { blockNumber: block.number, blockGasLimit: block.gasLimit },
      };
    }

    return {
      blockGasLimit: block.gasLimit,
      estimatedGasHex,
      simulationFails,
    };
  }

  /**
   * Estimates the tx's gas usage
   *
   * @param {object} txMeta - the txMeta object
   * @param {object} options - options object
   * @param {object} options.query - the ethQuery obj
   * @returns {string} the estimated gas limit as a hex string
   */
  async _estimateTxGas(txMeta, { query }) {
    const txParams = cloneDeep(txMeta.txParams);

    // `eth_estimateGas` can fail if the user has insufficient balance for the
    // value being sent, or for the gas cost. We don't want to check their
    // balance here, we just want the gas estimate. The gas price is removed
    // to skip those balance checks. We check balance elsewhere. We also delete
    // maxFeePerGas and maxPriorityFeePerGas to support EIP-1559 txs.
    delete txParams.gasPrice;
    delete txParams.maxFeePerGas;
    delete txParams.maxPriorityFeePerGas;

    // estimate tx gas requirements
    return await query.estimateGas(txParams);
  }

  /**
   * Adds a gas buffer with out exceeding the block gas limit
   *
   * @param {string} initialGasLimitHex - the initial gas limit to add the buffer too
   * @param {string} blockGasLimitHex - the block gas limit
   * @param multiplier
   * @returns {string} the buffered gas limit as a hex string
   */
  addGasBuffer(initialGasLimitHex, blockGasLimitHex, multiplier = 1.5) {
    const initialGasLimitBn = hexToBn(initialGasLimitHex);
    const blockGasLimitBn = hexToBn(blockGasLimitHex);
    const upperGasLimitBn = blockGasLimitBn.muln(0.9);
    const bufferedGasLimitBn = initialGasLimitBn.muln(multiplier);

    // if initialGasLimit is above blockGasLimit, dont modify it
    if (initialGasLimitBn.gt(upperGasLimitBn)) {
      return bnToHex(initialGasLimitBn);
    }
    // if bufferedGasLimit is below blockGasLimit, use bufferedGasLimit
    if (bufferedGasLimitBn.lt(upperGasLimitBn)) {
      return bnToHex(bufferedGasLimitBn);
    }
    // otherwise use blockGasLimit
    return bnToHex(upperGasLimitBn);
  }

  async getBufferedGasLimit(txMeta, multiplier, { networkClientId } = {}) {
    const { blockGasLimit, estimatedGasHex, simulationFails } =
      await this.analyzeGasUsage(txMeta, { networkClientId });
    // add additional gas buffer to our estimation for safety
    const gasLimit = this.addGasBuffer(
      addHexPrefix(estimatedGasHex),
      blockGasLimit,
      multiplier,
    );
    return { gasLimit, simulationFails };
  }
}
