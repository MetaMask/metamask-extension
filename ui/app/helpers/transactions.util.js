import ethUtil from 'ethereumjs-util'
import MethodRegistry from 'eth-method-registry'
import abi from 'human-standard-token-abi'
import abiDecoder from 'abi-decoder'
import { hexToDecimal } from './conversions.util'

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
  UNKNOWN_FUNCTION_KEY,
} from '../constants/transactions'

abiDecoder.addABI(abi)

export function getTokenData (data = {}) {
  return abiDecoder.decodeMethod(data)
}

const registry = new MethodRegistry({ provider: global.ethereumProvider })

export async function getMethodData (data = {}) {
  const prefixedData = ethUtil.addHexPrefix(data)
  const fourBytePrefix = prefixedData.slice(0, 10)
  const sig = await registry.lookup(fourBytePrefix)
  const parsedResult = registry.parse(sig)

  return {
    name: parsedResult.name,
    params: parsedResult.args,
  }
}

export function isConfirmDeployContract (txData = {}) {
  const { txParams = {} } = txData
  return !txParams.to
}

export function getTransactionActionKey (transaction, methodData) {
  const { txParams: { data } = {}, msgParams } = transaction

  if (msgParams) {
    return SIGNATURE_REQUEST_KEY
  }

  if (isConfirmDeployContract(transaction)) {
    return DEPLOY_CONTRACT_ACTION_KEY
  }

  if (data) {
    const { name } = methodData
    const methodName = name && name.toLowerCase()

    if (!methodName) {
      return UNKNOWN_FUNCTION_KEY
    }

    switch (methodName) {
      case TOKEN_METHOD_TRANSFER:
        return SEND_TOKEN_ACTION_KEY
      case TOKEN_METHOD_APPROVE:
        return APPROVE_ACTION_KEY
      case TOKEN_METHOD_TRANSFER_FROM:
        return TRANSFER_FROM_ACTION_KEY
      default:
        return name
    }
  } else {
    return SEND_ETHER_ACTION_KEY
  }
}

export function getLatestSubmittedTxWithEarliestNonce (transactions = []) {
  if (!transactions.length) {
    return {}
  }

  return transactions.reduce((acc, current) => {
    const accNonce = hexToDecimal(acc.nonce)
    const currentNonce = hexToDecimal(current.nonce)

    if (currentNonce < accNonce) {
      return current
    } else if (currentNonce === accNonce) {
      return current.submittedTime > acc.submittedTime ? current : acc
    } else {
      return acc
    }
  })
}
