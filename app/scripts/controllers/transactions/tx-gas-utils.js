import { addHexPrefix, isValidContractAddress } from 'cfx-util'
import log from 'loglevel'
import { TRANSACTION_NO_CONTRACT_ERROR_KEY } from '../../../../ui/app/helpers/constants/error-keys'
import { SEND_ETHER_ACTION_KEY } from '../../../../ui/app/helpers/constants/transactions.js'
import EthQuery from '../../ethjs-query'
import { bnToHex, hexToBn } from '../../lib/util'

export const SIMPLE_GAS_COST = '0x5208' // Hex for 21000, cost of a simple send.
export const SIMPLE_STORAGE_COST = '0x0' // Hex for 0, cost of a simple send.

/**
tx-gas-utils are gas utility methods for Transaction manager
its passed ethquery
and used to do things like calculate gas of a tx.
@param {Object} provider - A network provider.
*/

class TxGasUtil {
  constructor(provider) {
    this.query = new EthQuery(provider)
  }

  /**
    @param {Object} txMeta - the txMeta object
    @returns {Object} - the txMeta object with the gas written to the txParams
  */
  async analyzeGasUsage(txMeta, getCodeResponse) {
    let estimatedGasHex
    let estimatedStorageHex
    try {
      const {
        gasUsed,
        storageCollateralized,
      } = await this.estimateTxGasAndCollateral(txMeta)

      if (gasUsed?.constructor?.name === 'BN') {
        estimatedGasHex = gasUsed.toString(16)
      } else if (typeof gasUsed !== 'string' && gasUsed.toString) {
        estimatedGasHex = gasUsed.toString(16)
      } else {
        estimatedGasHex = gasUsed
      }
      if (storageCollateralized?.constructor?.name === 'BN') {
        estimatedStorageHex = storageCollateralized.toString(16)
      } else if (
        typeof storageCollateralized !== 'string' &&
        storageCollateralized.toString
      ) {
        estimatedStorageHex = storageCollateralized.toString(16)
      } else {
        estimatedStorageHex = storageCollateralized
      }
    } catch (err) {
      log.warn(err)
      txMeta.simulationFails = {
        reason: err.message,
        errorKey: err.errorKey,
      }

      if (err.errorKey === TRANSACTION_NO_CONTRACT_ERROR_KEY) {
        txMeta.simulationFails.debug.getCodeResponse =
          err.getCodeResponse || getCodeResponse
      }

      return txMeta
    }
    this.setTxGas(txMeta, {
      estimatedGasHex,
      estimatedStorageHex,
    })
    return txMeta
  }

  /**
    Estimates the tx's gas/storageLimit usage
    @param {Object} txMeta - the txMeta object
    @returns {string} - the estimated gas limit as a hex string
  */
  async estimateTxGasAndCollateral(txMeta) {
    // new unapproved tx will come here first
    const txParams = txMeta.txParams
    if (txParams.to && !isValidContractAddress(txParams.to) && !txParams.data) {
      txMeta.simpleSend = true
    }

    // check if gasLimit is already specified
    txMeta.gasLimitSpecified = Boolean(txParams.gas)
    txMeta.storageLimitSpecified = Boolean(txParams.storageLimit)

    // if it is, use that value
    if (txMeta.gasLimitSpecified && txMeta.storageLimitSpecified) {
      return Promise.resolve({
        gasUsed: txParams.gas,
        storageCollateralized: txParams.storageLimit,
      })
    }

    const recipient = txParams.to
    const hasRecipient = Boolean(recipient)

    // see if we can set the gas based on the recipient
    if (hasRecipient) {
      // For an address with no code, geth will return '0x', and ganache-core v2.2.1 will return '0x0'
      const categorizedAsSimple =
        txMeta.transactionCategory === SEND_ETHER_ACTION_KEY

      if (categorizedAsSimple && txMeta.simpleSend) {
        // if there's data in the params, but there's no contract code, it's not a valid transaction
        // if (txParams.data) {
        //   const err = new Error(
        //     'TxGasUtil - Trying to call a function on a non-contract address'
        //   )
        //   // set error key so ui can display localized error message
        //   err.errorKey = TRANSACTION_NO_CONTRACT_ERROR_KEY

        //   // set the response on the error so that we can see in logs what the actual response was
        //   err.getCodeResponse = getCodeResponse
        //   throw err
        // }

        // This is a standard ether simple send, gas requirement is exactly 21k
        txParams.gas = SIMPLE_GAS_COST
        txParams.storageLimit = SIMPLE_STORAGE_COST
        // prevents buffer addition
        txMeta.simpleSend = true
        return Promise.resolve({
          gasUsed: SIMPLE_GAS_COST,
          storageCollateralized: SIMPLE_STORAGE_COST,
        })
      }
    }

    // estimate tx gas requirements
    return await this.query.estimateGas(txParams)
  }

  /**
    Writes the gas/storage on the txParams in the txMeta
    @param {Object} txMeta - the txMeta object to write to
    @param {string} estimatedGasHex - the estimated gas hex
  */
  setTxGas(txMeta, { estimatedGasHex, estimatedStorageHex }) {
    txMeta.estimatedGas = addHexPrefix(estimatedGasHex)
    txMeta.estimatedStorage = addHexPrefix(estimatedStorageHex)
    const txParams = txMeta.txParams

    if (txMeta.simpleSend) {
      txMeta.estimatedGas = SIMPLE_GAS_COST
      txParams.gas = SIMPLE_GAS_COST
      txMeta.estimatedStorage = SIMPLE_STORAGE_COST
      txParams.storageLimit = SIMPLE_STORAGE_COST
      txMeta.storageLimitSpecified = true
      txMeta.gasLimitSpecified = true
      return
    }

    if (txMeta.storageLimitSpecified) {
      txMeta.estimatedStorage = txParams.storageLimit
    }

    // if gasLimit was specified and doesnt OOG,
    // use original specified amount
    if (txMeta.gasLimitSpecified) {
      txMeta.estimatedGas = txParams.gas
    }

    if (!txMeta.storageLimitSpecified) {
      txParams.storageLimit = txMeta.estimatedStorage
      txMeta.storageLimitSpecified = true
    }

    if (txMeta.gasLimitSpecified && txMeta.storageLimitSpecified) {
 return
}

    const recommendedGasHex = bnToHex(hexToBn(txMeta.estimatedGas).muln(1.3))
    txParams.gas = recommendedGasHex
    txMeta.gasLimitSpecified = true

    return
  }

  /**
    Adds a gas buffer with out exceeding the block gas limit

    @param {string} initialGasLimitHex - the initial gas limit to add the buffer too
    @param {string} blockGasLimitHex - the block gas limit
    @returns {string} - the buffered gas limit as a hex string
  */
  addGasBuffer(initialGasLimitHex, blockGasLimitHex) {
    const initialGasLimitBn = hexToBn(initialGasLimitHex)
    const blockGasLimitBn = hexToBn(blockGasLimitHex)
    const upperGasLimitBn = blockGasLimitBn.muln(0.9)
    const bufferedGasLimitBn = initialGasLimitBn.muln(1.3)

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

export default TxGasUtil
