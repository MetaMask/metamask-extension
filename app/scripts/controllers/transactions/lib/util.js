import { addHexPrefix, isValidAddress } from 'ethereumjs-util'

const normalizers = {
  from: (from) => addHexPrefix(from),
  to: (to, lowerCase) =>
    lowerCase ? addHexPrefix(to).toLowerCase() : addHexPrefix(to),
  nonce: (nonce) => addHexPrefix(nonce),
  value: (value) => addHexPrefix(value),
  data: (data) => addHexPrefix(data),
  gas: (gas) => addHexPrefix(gas),
  gasPrice: (gasPrice) => addHexPrefix(gasPrice),
}

/**
 * Normalizes the given txParams
 * @param {Object} txParams - The transaction params
 * @param {boolean} [lowerCase] - Whether to lowercase the 'to' address.
 * Default: true
 * @returns {Object} the normalized tx params
 */
export function normalizeTxParams(txParams, lowerCase = true) {
  // apply only keys in the normalizers
  const normalizedTxParams = {}
  for (const key in normalizers) {
    if (txParams[key]) {
      normalizedTxParams[key] = normalizers[key](txParams[key], lowerCase)
    }
  }
  return normalizedTxParams
}

/**
 * Validates the given tx parameters
 * @param {Object} txParams - the tx params
 * @throws {Error} if the tx params contains invalid fields
 */
export function validateTxParams(txParams) {
  validateFrom(txParams)
  validateRecipient(txParams)
  if ('value' in txParams) {
    const value = txParams.value.toString()
    if (value.includes('-')) {
      throw new Error(
        `Invalid transaction value of ${txParams.value} not a positive number.`,
      )
    }

    if (value.includes('.')) {
      throw new Error(
        `Invalid transaction value of ${txParams.value} number must be in wei`,
      )
    }
  }
}

/**
 * Validates the {@code from} field in the given tx params
 * @param {Object} txParams
 * @throws {Error} if the from address isn't valid
 */
export function validateFrom(txParams) {
  if (!(typeof txParams.from === 'string')) {
    throw new Error(`Invalid from address ${txParams.from} not a string`)
  }
  if (!isValidAddress(txParams.from)) {
    throw new Error('Invalid from address')
  }
}

/**
 * Validates the {@code to} field in the given tx params
 * @param {Object} txParams - the tx params
 * @returns {Object} the tx params
 * @throws {Error} if the recipient is invalid OR there isn't tx data
 */
export function validateRecipient(txParams) {
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

/**
 * Returns a list of final states
 * @returns {string[]} the states that can be considered final states
 */
export function getFinalStates() {
  return [
    'rejected', // the user has responded no!
    'confirmed', // the tx has been included in a block.
    'failed', // the tx failed for some reason, included on tx data.
    'dropped', // the tx nonce was already used
  ]
}
