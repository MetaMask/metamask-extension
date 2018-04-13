const {
  addHexPrefix,
  isValidAddress,
} = require('ethereumjs-util')

module.exports = {
  normalizeTxParams,
  validateTxParams,
  validateFrom,
  validateRecipient,
}


// functions that handle normalizing of that key in txParams
const normalizers = {
  from: from => addHexPrefix(from).toLowerCase(),
  to: to => addHexPrefix(to).toLowerCase(),
  nonce: nonce => addHexPrefix(nonce),
  value: value =>  value ? addHexPrefix(value) : '0x0',
  data: data => addHexPrefix(data),
  gas: gas => addHexPrefix(gas),
  gasPrice: gasPrice => addHexPrefix(gasPrice),
}
 /**
 */
function normalizeTxParams (txParams) {
  // apply only keys in the normalizers
  const normalizedTxParams = {}
  for (let key in normalizers) {
    if (txParams[key]) normalizedTxParams[key] = normalizers[key](txParams[key])
  }
  return normalizedTxParams
}

function validateTxParams (txParams) {
  validateFrom(txParams)
  validateRecipient(txParams)
  if ('value' in txParams) {
    const value = txParams.value.toString()
    if (value.includes('-')) {
      throw new Error(`Invalid transaction value of ${txParams.value} not a positive number.`)
    }

    if (value.includes('.')) {
      throw new Error(`Invalid transaction value of ${txParams.value} number must be in wei`)
    }
  }
}

function validateFrom (txParams) {
  if (!(typeof txParams.from === 'string')) throw new Error(`Invalid from address ${txParams.from} not a string`)
  if (!isValidAddress(txParams.from)) throw new Error('Invalid from address')
}

function validateRecipient (txParams) {
  if (txParams.to === '0x' || txParams.to === null) {
    if (txParams.data) {
      delete txParams.to
    } else {
      throw new Error('Invalid recipient address')
    }
  } else if (txParams.to !== undefined && !isValidAddress(txParams.to)) {
    throw new Error('Invalid recipient address')
  }
  return txParams
}
