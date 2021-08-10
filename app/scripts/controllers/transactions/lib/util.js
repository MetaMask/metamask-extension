import { ethErrors } from 'eth-rpc-errors';
import { addHexPrefix } from '../../../lib/util';
import {
  TRANSACTION_ENVELOPE_TYPES,
  TRANSACTION_STATUSES,
} from '../../../../../shared/constants/transaction';
import { isEIP1559Transaction } from '../../../../../shared/modules/transaction.utils';
import { isValidHexAddress } from '../../../../../shared/modules/hexstring-utils';

const normalizers = {
  from: addHexPrefix,
  to: (to, lowerCase) =>
    lowerCase ? addHexPrefix(to).toLowerCase() : addHexPrefix(to),
  nonce: addHexPrefix,
  value: addHexPrefix,
  data: addHexPrefix,
  gas: addHexPrefix,
  gasPrice: addHexPrefix,
  maxFeePerGas: addHexPrefix,
  maxPriorityFeePerGas: addHexPrefix,
  type: addHexPrefix,
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
 * Given two fields, ensure that the second field is not included in txParams,
 * and if it is throw an invalidParams error.
 * @param {Object} txParams - the transaction parameters object
 * @param {string} fieldBeingValidated - the current field being validated
 * @param {string} mutuallyExclusiveField - the field to ensure is not provided
 * @throws {ethErrors.rpc.invalidParams} - throws if mutuallyExclusiveField is
 *  present in txParams.
 */
function ensureMutuallyExclusiveFieldsNotProvided(
  txParams,
  fieldBeingValidated,
  mutuallyExclusiveField,
) {
  if (typeof txParams[mutuallyExclusiveField] !== 'undefined') {
    throw ethErrors.rpc.invalidParams(
      `Invalid transaction params: specified ${fieldBeingValidated} but also included ${mutuallyExclusiveField}, these cannot be mixed`,
    );
  }
}

/**
 * Ensures that the provided value for field is a string, throws an
 * invalidParams error if field is not a string.
 * @param {Object} txParams - the transaction parameters object
 * @param {string} field - the current field being validated
 * @throws {ethErrors.rpc.invalidParams} - throws if field is not a string
 */
function ensureFieldIsString(txParams, field) {
  if (typeof txParams[field] !== 'string') {
    throw ethErrors.rpc.invalidParams(
      `Invalid transaction params: ${field} is not a string. got: (${txParams[field]})`,
    );
  }
}

/**
 * Ensures that the provided txParams has the proper 'type' specified for the
 * given field, if it is provided. If types do not match throws an
 * invalidParams error.
 * @param {Object} txParams - the transaction parameters object
 * @param {'gasPrice' | 'maxFeePerGas' | 'maxPriorityFeePerGas'} field - the
 *  current field being validated
 * @throws {ethErrors.rpc.invalidParams} - throws if type does not match the
 *  expectations for provided field.
 */
function ensureProperTransactionEnvelopeTypeProvided(txParams, field) {
  switch (field) {
    case 'maxFeePerGas':
    case 'maxPriorityFeePerGas':
      if (
        txParams.type &&
        txParams.type !== TRANSACTION_ENVELOPE_TYPES.FEE_MARKET
      ) {
        throw ethErrors.rpc.invalidParams(
          `Invalid transaction envelope type: specified type "${txParams.type}" but including maxFeePerGas and maxPriorityFeePerGas requires type: "${TRANSACTION_ENVELOPE_TYPES.FEE_MARKET}"`,
        );
      }
      break;
    case 'gasPrice':
    default:
      if (
        txParams.type &&
        txParams.type === TRANSACTION_ENVELOPE_TYPES.FEE_MARKET
      ) {
        throw ethErrors.rpc.invalidParams(
          `Invalid transaction envelope type: specified type "${txParams.type}" but included a gasPrice instead of maxFeePerGas and maxPriorityFeePerGas`,
        );
      }
  }
}

/**
 * Validates the given tx parameters
 * @param {Object} txParams - the tx params
 * @param {boolean} eip1559Compatibility - whether or not the current network supports EIP-1559 transactions
 * @throws {Error} if the tx params contains invalid fields
 */
export function validateTxParams(txParams, eip1559Compatibility = true) {
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
  if (isEIP1559Transaction({ txParams }) && !eip1559Compatibility) {
    throw ethErrors.rpc.invalidParams(
      'Invalid transaction params: params specify an EIP-1559 transaction but the current network does not support EIP-1559',
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
      case 'gasPrice':
        ensureProperTransactionEnvelopeTypeProvided(txParams, 'gasPrice');
        ensureMutuallyExclusiveFieldsNotProvided(
          txParams,
          'gasPrice',
          'maxFeePerGas',
        );
        ensureMutuallyExclusiveFieldsNotProvided(
          txParams,
          'gasPrice',
          'maxPriorityFeePerGas',
        );
        ensureFieldIsString(txParams, 'gasPrice');
        break;
      case 'maxFeePerGas':
        ensureProperTransactionEnvelopeTypeProvided(txParams, 'maxFeePerGas');
        ensureMutuallyExclusiveFieldsNotProvided(
          txParams,
          'maxFeePerGas',
          'gasPrice',
        );
        ensureFieldIsString(txParams, 'maxFeePerGas');
        break;
      case 'maxPriorityFeePerGas':
        ensureProperTransactionEnvelopeTypeProvided(
          txParams,
          'maxPriorityFeePerGas',
        );
        ensureMutuallyExclusiveFieldsNotProvided(
          txParams,
          'maxPriorityFeePerGas',
          'gasPrice',
        );
        ensureFieldIsString(txParams, 'maxPriorityFeePerGas');
        break;
      case 'value':
        ensureFieldIsString(txParams, 'value');
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
        ensureFieldIsString(txParams, key);
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
  if (!isValidHexAddress(txParams.from, { allowNonPrefixed: false })) {
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
  } else if (
    txParams.to !== undefined &&
    !isValidHexAddress(txParams.to, { allowNonPrefixed: false })
  ) {
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
