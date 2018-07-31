import ethUtil from 'ethereumjs-util'
import MethodRegistry from 'eth-method-registry'
const registry = new MethodRegistry({ provider: global.ethereumProvider })

import {
  TOKEN_METHOD_TRANSFER,
  TOKEN_METHOD_APPROVE,
  TOKEN_METHOD_TRANSFER_FROM,
  SEND_ETHER_ACTION_KEY,
  DEPLOY_CONTRACT_ACTION_KEY,
  APPROVE_ACTION_KEY,
  SEND_TOKEN_ACTION_KEY,
  TRANSFER_FROM_ACTION_KEY,
} from '../constants/transactions'

export function isConfirmDeployContract (txData = {}) {
  const { txParams = {} } = txData
  return !txParams.to
}

export function getTransactionActionKey (transaction, methodData) {
  const { txParams: { data } = {} } = transaction

  if (isConfirmDeployContract(transaction)) {
    return DEPLOY_CONTRACT_ACTION_KEY
  }

  if (data) {
    const { name } = methodData
    const methodName = name && name.toLowerCase()

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
