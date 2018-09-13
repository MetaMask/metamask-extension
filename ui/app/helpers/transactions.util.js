import ethUtil from 'ethereumjs-util'
import MethodRegistry from 'eth-method-registry'
import abi from 'human-standard-token-abi'
import abiDecoder from 'abi-decoder'

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

import { addCurrencies } from '../conversion-util'

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

export async function getTransactionActionKey (transaction, methodData) {
  const { txParams: { data, to } = {}, msgParams } = transaction

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
  return code && code !== '0x'
}

export function sumHexes (...args) {
  const total = args.reduce((acc, base) => {
    return addCurrencies(acc, base, {
      toNumericBase: 'hex',
    })
  })

  return ethUtil.addHexPrefix(total)
}
