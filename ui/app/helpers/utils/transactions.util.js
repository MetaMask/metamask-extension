import ethUtil from 'ethereumjs-util'
import MethodRegistry from 'eth-method-registry'
import abi from 'human-standard-token-abi'
import abiDecoder from 'abi-decoder'
import {
  TRANSACTION_TYPE_CANCEL,
  TRANSACTION_STATUS_CONFIRMED,
} from '../../../../app/scripts/controllers/transactions/enums'
import { MESSAGE_TYPE } from '../../../../app/scripts/lib/enums'
import { getEtherscanNetworkPrefix } from '../../../lib/etherscan-prefix-for-network'
import fetchWithCache from './fetch-with-cache'

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
  DECRYPT_REQUEST_KEY,
  ENCRYPTION_PUBLIC_KEY_REQUEST_KEY,
  CONTRACT_INTERACTION_KEY,
  CANCEL_ATTEMPT_ACTION_KEY,
  DEPOSIT_TRANSACTION_KEY,
} from '../constants/transactions'

import log from 'loglevel'
import { addCurrencies } from './conversion-util'

abiDecoder.addABI(abi)

export function getTokenData (data = '') {
  return abiDecoder.decodeMethod(data)
}

async function getMethodFrom4Byte (fourBytePrefix) {
  const fourByteResponse = (await fetchWithCache(`https://www.4byte.directory/api/v1/signatures/?hex_signature=${fourBytePrefix}`, {
    referrerPolicy: 'no-referrer-when-downgrade',
    body: null,
    method: 'GET',
    mode: 'cors',
  }))

  if (fourByteResponse.count === 1) {
    return fourByteResponse.results[0].text_signature
  } else {
    return null
  }
}
let registry

/**
 * Attempts to return the method data from the MethodRegistry library, the message registry library and the token abi, in that order of preference
 * @param {string} fourBytePrefix - The prefix from the method code associated with the data
 * @returns {Object}
 */
export async function getMethodDataAsync (fourBytePrefix) {
  try {
    const fourByteSig = getMethodFrom4Byte(fourBytePrefix).catch((e) => {
      log.error(e)
      return null
    })

    if (!registry) {
      registry = new MethodRegistry({ provider: global.ethereumProvider })
    }

    let sig = await registry.lookup(fourBytePrefix)

    if (!sig) {
      sig = await fourByteSig
    }

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
    return {}
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
  * Given an transaction category, returns a boolean which indicates whether the transaction is calling an erc20 token method
  *
  * @param {string} transactionCategory - The category of transaction being evaluated
  * @returns {boolean} - whether the transaction is calling an erc20 token method
  */
export function isTokenMethodAction (transactionCategory) {
  return [
    TOKEN_METHOD_TRANSFER,
    TOKEN_METHOD_APPROVE,
    TOKEN_METHOD_TRANSFER_FROM,
  ].includes(transactionCategory)
}

/**
 * Given a transactions, returns a boolean which indictes wheather the transaction has a cancel attempt
 * @param {Object} transaction - The transaction that is being evaluated
 * @returns {boolean} - wheather the transaction has a cancel type property
 */

export function isCancelledTransaction (transaction) {
  const { type } = transaction
  return type === 'cancel'
}

/**
 * Returns the action of a transaction as a key to be passed into the translator.
 * @param {Object} transaction - txData object
 * @returns {string|undefined}
 */
export function getTransactionActionKey (transaction) {
  const { msgParams, type, transactionCategory } = transaction

  if (transactionCategory === 'incoming') {
    return DEPOSIT_TRANSACTION_KEY
  }

  if (type === 'cancel') {
    return CANCEL_ATTEMPT_ACTION_KEY
  }

  if (msgParams) {
    if (type === MESSAGE_TYPE.ETH_DECRYPT) {
      return DECRYPT_REQUEST_KEY
    } else if (type === MESSAGE_TYPE.ETH_GET_ENCRYPTION_PUBLIC_KEY) {
      return ENCRYPTION_PUBLIC_KEY_REQUEST_KEY
    } else {
      return SIGNATURE_REQUEST_KEY
    }
  }

  if (isConfirmDeployContract(transaction)) {
    return DEPLOY_CONTRACT_ACTION_KEY
  }

  const isTokenAction = isTokenMethodAction(transactionCategory)
  const isNonTokenSmartContract = transactionCategory === CONTRACT_INTERACTION_KEY

  if (isTokenAction || isNonTokenSmartContract) {
    switch (transactionCategory) {
      case TOKEN_METHOD_TRANSFER:
        return SEND_TOKEN_ACTION_KEY
      case TOKEN_METHOD_APPROVE:
        return APPROVE_ACTION_KEY
      case TOKEN_METHOD_TRANSFER_FROM:
        return TRANSFER_FROM_ACTION_KEY
      case CONTRACT_INTERACTION_KEY:
        return CONTRACT_INTERACTION_KEY
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
 * Returns an external block explorer URL at which a transaction can be viewed.
 * @param {number} networkId
 * @param {string} hash
 * @param {Object} rpcPrefs
 */
export function getBlockExplorerUrlForTx (networkId, hash, rpcPrefs = {}) {
  if (rpcPrefs.blockExplorerUrl) {
    return `${rpcPrefs.blockExplorerUrl.replace(/\/+$/, '')}/tx/${hash}`
  }
  const prefix = getEtherscanNetworkPrefix(networkId)
  return `https://${prefix}etherscan.io/tx/${hash}`
}
