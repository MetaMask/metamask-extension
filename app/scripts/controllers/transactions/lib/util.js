import { isValidAddress } from 'ethereumjs-util';
import { ethErrors } from 'eth-rpc-errors';
import { addHexPrefix } from '../../../lib/util';
import { TRANSACTION_STATUSES } from '../../../../../shared/constants/transaction';

const normalizers = {
  from: (from) => addHexPrefix(from),
  to: (to, lowerCase) =>
    lowerCase ? addHexPrefix(to).toLowerCase() : addHexPrefix(to),
  nonce: (nonce) => addHexPrefix(nonce),
  value: (value) => addHexPrefix(value),
  data: (data) => addHexPrefix(data),
  gas: (gas) => addHexPrefix(gas),
  gasPrice: (gasPrice) => addHexPrefix(gasPrice),
};

export function normalizeAndValidateTxParams(txParams, lowerCase = true) {
  const normalizedTxParams = normalizeTxParams(txParams, lowerCase);
  validateTxParams(normalizedTxParams);
  return normalizedTxParams;
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
  const normalizedTxParams = {};
  for (const key in normalizers) {
    if (txParams[key]) {
      normalizedTxParams[key] = normalizers[key](txParams[key], lowerCase);
    }
  }
  return normalizedTxParams;
}

/**
 * Validates the given tx parameters
 * @param {Object} txParams - the tx params
 * @throws {Error} if the tx params contains invalid fields
 */
export function validateTxParams(txParams) {
  if (!txParams || typeof txParams !== 'object' || Array.isArray(txParams)) {
    throw ethErrors.rpc.invalidParams(
      'Invalid transaction params: must be an object.',
    );
  }
  if (!txParams.to && !txParams.data) {
    throw ethErrors.rpc.invalidParams(
      'Invalid transaction params: must specify "data" for contract deployments, or "to" (and optionally "data") for all other types of transactions.',
    );
  }

  Object.entries(txParams).forEach(([key, value]) => {
    // validate types
    switch (key) {
      case 'from':
        validateFrom(txParams);
        break;
      case 'to':
        validateRecipient(txParams);
        break;
      case 'value':
        if (typeof value !== 'string') {
          throw ethErrors.rpc.invalidParams(
            `Invalid transaction params: ${key} is not a string. got: (${value})`,
          );
        }
        if (value.toString().includes('-')) {
          throw ethErrors.rpc.invalidParams(
            `Invalid transaction value "${value}": not a positive number.`,
          );
        }

        if (value.toString().includes('.')) {
          throw ethErrors.rpc.invalidParams(
            `Invalid transaction value of "${value}": number must be in wei.`,
          );
        }
        break;
      case 'chainId':
        if (typeof value !== 'number' && typeof value !== 'string') {
          throw ethErrors.rpc.invalidParams(
            `Invalid transaction params: ${key} is not a Number or hex string. got: (${value})`,
          );
        }
        break;
      default:
        if (typeof value !== 'string') {
          throw ethErrors.rpc.invalidParams(
            `Invalid transaction params: ${key} is not a string. got: (${value})`,
          );
        }
    }
  });
}

/**
 * Validates the {@code from} field in the given tx params
 * @param {Object} txParams
 * @throws {Error} if the from address isn't valid
 */
export function validateFrom(txParams) {
  if (!(typeof txParams.from === 'string')) {
    throw ethErrors.rpc.invalidParams(
      `Invalid "from" address "${txParams.from}": not a string.`,
    );
  }
  if (!isValidAddress(txParams.from)) {
    throw ethErrors.rpc.invalidParams('Invalid "from" address.');
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
      delete txParams.to;
    } else {
      throw ethErrors.rpc.invalidParams('Invalid "to" address.');
    }
  } else if (txParams.to !== undefined && !isValidAddress(txParams.to)) {
    throw ethErrors.rpc.invalidParams('Invalid "to" address.');
  }
  return txParams;
}

/**
 * Returns a list of final states
 * @returns {string[]} the states that can be considered final states
 */
export function getFinalStates() {
  return [
    TRANSACTION_STATUSES.REJECTED, // the user has responded no!
    TRANSACTION_STATUSES.CONFIRMED, // the tx has been included in a block.
    TRANSACTION_STATUSES.FAILED, // the tx failed for some reason, included on tx data.
    TRANSACTION_STATUSES.DROPPED, // the tx nonce was already used
  ];
}
