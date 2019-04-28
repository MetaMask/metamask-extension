import ethUtil from 'ethereumjs-util'
import MethodRegistry from 'eth-method-registry'
import abi from 'human-standard-token-abi'
import abiDecoder from 'abi-decoder'
import {
  TRANSACTION_TYPE_CANCEL,
  TRANSACTION_STATUS_CONFIRMED,
} from '../../../../app/scripts/controllers/transactions/enums'
import prefixForNetwork from '../../../lib/etherscan-prefix-for-network'


import {
  TOKEN_METHOD_TRANSFER,
  TOKEN_METHOD_APPROVE,
  TOKEN_METHOD_TRANSFER_FROM,
  SEND_ETHER_ACTION_KEY,
  DEPLOY_CONTRACT_ACTION_KEY,
  APPROVE_ACTION_KEY,
  SEND_TOKEN_ACTION_KEY,
  TRANSFER_FROM_ACTION_KEY,
  SIGNATURE_REQUEST_KEY,
  CONTRACT_INTERACTION_KEY,
  CANCEL_ATTEMPT_ACTION_KEY,
} from '../constants/transactions'

import log from 'loglevel'
import { addCurrencies } from './conversion-util'

abiDecoder.addABI(abi)

export function getTokenData (data = '') {
  return abiDecoder.decodeMethod(data)
}

const registry = new MethodRegistry({ provider: global.ethereumProvider })

/**
 * Attempts to return the method data from the MethodRegistry library, if the method exists in the
 * registry. Otherwise, returns an empty object.
 * @param {string} data - The hex data (@code txParams.data) of a transaction
 * @returns {Object}
 */
  export async function getMethodData (data = '') {
    const prefixedData = ethUtil.addHexPrefix(data)
    const fourBytePrefix = prefixedData.slice(0, 10)

    try {
      const sig = await registry.lookup(fourBytePrefix)

      if (!sig) {
        return {}
      }

      const parsedResult = registry.parse(sig)

      return {
        name: parsedResult.name,
        params: parsedResult.args,
      }
    } catch (error) {
      log.error(error)
      const contractData = getTokenData(data)
      const { name } = contractData || {}
      return { name }
    }


}

export function isConfirmDeployContract (txData = {}) {
  const { txParams = {} } = txData
  return !txParams.to
}

/**
 * Returns four-byte method signature from data
 *
 * @param {string} data - The hex data (@code txParams.data) of a transaction
 * @returns {string} - The four-byte method signature
 */
export function getFourBytePrefix (data = '') {
  const prefixedData = ethUtil.addHexPrefix(data)
  const fourBytePrefix = prefixedData.slice(0, 10)
  return fourBytePrefix
}

/**
 * Returns the action of a transaction as a key to be passed into the translator.
 * @param {Object} transaction - txData object
 * @param {Object} methodData - Data returned from eth-method-registry
 * @returns {string|undefined}
 */
export async function getTransactionActionKey (transaction, methodData) {
  const { txParams: { data, to } = {}, msgParams, type } = transaction

  if (type === 'cancel') {
    return CANCEL_ATTEMPT_ACTION_KEY
  }

  if (msgParams) {
    return SIGNATURE_REQUEST_KEY
  }

  if (isConfirmDeployContract(transaction)) {
    return DEPLOY_CONTRACT_ACTION_KEY
  }

  if (data) {
    const toSmartContract = await isSmartContractAddress(to)

    if (!toSmartContract) {
      return SEND_ETHER_ACTION_KEY
    }

    const { name } = methodData
    const methodName = name && name.toLowerCase()

    if (!methodName) {
      return CONTRACT_INTERACTION_KEY
    }

    switch (methodName) {
      case TOKEN_METHOD_TRANSFER:
        return SEND_TOKEN_ACTION_KEY
      case TOKEN_METHOD_APPROVE:
        return APPROVE_ACTION_KEY
      case TOKEN_METHOD_TRANSFER_FROM:
        return TRANSFER_FROM_ACTION_KEY
      default:
        return undefined
    }
  } else {
    return SEND_ETHER_ACTION_KEY
  }
}

export function getLatestSubmittedTxWithNonce (transactions = [], nonce = '0x0') {
  if (!transactions.length) {
    return {}
  }

  return transactions.reduce((acc, current) => {
    const { submittedTime, txParams: { nonce: currentNonce } = {} } = current

    if (currentNonce === nonce) {
      return acc.submittedTime
        ? submittedTime > acc.submittedTime ? current : acc
        : current
    } else {
      return acc
    }
  }, {})
}

export async function isSmartContractAddress (address) {
  const code = await global.eth.getCode(address)
  // Geth will return '0x', and ganache-core v2.2.1 will return '0x0'
  const codeIsEmpty = !code || code === '0x' || code === '0x0'
  return !codeIsEmpty
}

export function sumHexes (...args) {
  const total = args.reduce((acc, base) => {
    return addCurrencies(acc, base, {
      toNumericBase: 'hex',
    })
  })

  return ethUtil.addHexPrefix(total)
}

/**
 * Returns a status key for a transaction. Requires parsing the txMeta.txReceipt on top of
 * txMeta.status because txMeta.status does not reflect on-chain errors.
 * @param {Object} transaction - The txMeta object of a transaction.
 * @param {Object} transaction.txReceipt - The transaction receipt.
 * @returns {string}
 */
export function getStatusKey (transaction) {
  const { txReceipt: { status: receiptStatus } = {}, type, status } = transaction

  // There was an on-chain failure
  if (receiptStatus === '0x0') {
    return 'failed'
  }

  if (status === TRANSACTION_STATUS_CONFIRMED && type === TRANSACTION_TYPE_CANCEL) {
    return 'cancelled'
  }

  return transaction.status
}

/**
 * An external block explorer url at which a transaction can be viewed.
 * @param {number} networkId
 * @param {string} hash
 * @param {Object} rpcPrefs
 */
export function getBlockExplorerUrlForTx (networkId, hash, rpcPrefs = {}) {
  if (rpcPrefs.blockExplorerUrl) {
    return `${rpcPrefs.blockExplorerUrl}/tx/${hash}`
  }
  const prefix = prefixForNetwork(networkId)
  return `https://${prefix}etherscan.io/tx/${hash}`
}
