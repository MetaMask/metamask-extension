import ethUtil from 'ethereumjs-util'
import MethodRegistry from 'eth-method-registry'
import abi from 'human-standard-token-abi'
import { ethers } from 'ethers'
import log from 'loglevel'
import {
  TRANSACTION_TYPE_CANCEL,
  TRANSACTION_STATUS_CONFIRMED,
} from '../../../../app/scripts/controllers/transactions/enums'
import { getEtherscanNetworkPrefix } from '../../../lib/etherscan-prefix-for-network'
import {
  TOKEN_METHOD_TRANSFER,
  TOKEN_METHOD_APPROVE,
  TOKEN_METHOD_TRANSFER_FROM,
} from '../constants/transactions'
import fetchWithCache from './fetch-with-cache'

import { addCurrencies } from './conversion-util'

const hstInterface = new ethers.utils.Interface(abi)

/**
 * @typedef EthersContractCall
 * @type object
 * @property {any[]} args - The args/params to the function call.
 * An array-like object with numerical and string indices.
 * @property {string} name - The name of the function.
 * @property {string} signature - The function signature.
 * @property {string} sighash - The function signature hash.
 * @property {EthersBigNumber} value - The ETH value associated with the call.
 * @property {FunctionFragment} functionFragment - The Ethers function fragment
 * representation of the function.
 */

/**
 * @returns {EthersContractCall | undefined}
 */
export function getTokenData(data) {
  try {
    return hstInterface.parseTransaction({ data })
  } catch (error) {
    log.debug('Failed to parse transaction data.', error, data)
    return undefined
  }
}

async function getMethodFrom4Byte(fourBytePrefix) {
  const fourByteResponse = await fetchWithCache(
    `https://www.4byte.directory/api/v1/signatures/?hex_signature=${fourBytePrefix}`,
    {
      referrerPolicy: 'no-referrer-when-downgrade',
      body: null,
      method: 'GET',
      mode: 'cors',
    },
  )

  if (fourByteResponse.count === 1) {
    return fourByteResponse.results[0].text_signature
  }
  return null
}
let registry

/**
 * Attempts to return the method data from the MethodRegistry library, the message registry library and the token abi, in that order of preference
 * @param {string} fourBytePrefix - The prefix from the method code associated with the data
 * @returns {Object}
 */
export async function getMethodDataAsync(fourBytePrefix) {
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

/**
 * Returns four-byte method signature from data
 *
 * @param {string} data - The hex data (@code txParams.data) of a transaction
 * @returns {string} - The four-byte method signature
 */
export function getFourBytePrefix(data = '') {
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
export function isTokenMethodAction(transactionCategory) {
  return [
    TOKEN_METHOD_TRANSFER,
    TOKEN_METHOD_APPROVE,
    TOKEN_METHOD_TRANSFER_FROM,
  ].includes(transactionCategory)
}

export function getLatestSubmittedTxWithNonce(
  transactions = [],
  nonce = '0x0',
) {
  if (!transactions.length) {
    return {}
  }

  return transactions.reduce((acc, current) => {
    const { submittedTime, txParams: { nonce: currentNonce } = {} } = current

    if (currentNonce === nonce) {
      if (!acc.submittedTime) {
        return current
      }
      return submittedTime > acc.submittedTime ? current : acc
    }
    return acc
  }, {})
}

export async function isSmartContractAddress(address) {
  const code = await global.eth.getCode(address)
  // Geth will return '0x', and ganache-core v2.2.1 will return '0x0'
  const codeIsEmpty = !code || code === '0x' || code === '0x0'
  return !codeIsEmpty
}

export function sumHexes(...args) {
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
export function getStatusKey(transaction) {
  const {
    txReceipt: { status: receiptStatus } = {},
    type,
    status,
  } = transaction

  // There was an on-chain failure
  if (receiptStatus === '0x0') {
    return 'failed'
  }

  if (
    status === TRANSACTION_STATUS_CONFIRMED &&
    type === TRANSACTION_TYPE_CANCEL
  ) {
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
export function getBlockExplorerUrlForTx(networkId, hash, rpcPrefs = {}) {
  if (rpcPrefs.blockExplorerUrl) {
    return `${rpcPrefs.blockExplorerUrl.replace(/\/+$/u, '')}/tx/${hash}`
  }
  const prefix = getEtherscanNetworkPrefix(networkId)
  return `https://${prefix}etherscan.io/tx/${hash}`
}
