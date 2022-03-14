import { isHexString } from 'ethereumjs-util';
import { ethers } from 'ethers';
import abi from 'human-standard-token-abi';
import log from 'loglevel';
import { TOKEN_STANDARDS } from '../../ui/helpers/constants/common';
import { ASSET_TYPES, TRANSACTION_TYPES } from '../constants/transaction';
import { readAddressAsContract } from './contract-utils';
import { isEqualCaseInsensitive } from './string-utils';

/**
 * @typedef { 'transfer' | 'approve' | 'transferfrom' | 'contractInteraction'| 'simpleSend' } InferrableTransactionTypes
 */

/**
 * @typedef {Object} InferTransactionTypeResult
 * @property {InferrableTransactionTypes} type - The type of transaction
 * @property {string} getCodeResponse - The contract code, in hex format if
 *  it exists. '0x0' or '0x' are also indicators of non-existent contract
 *  code
 */

const hstInterface = new ethers.utils.Interface(abi);

export function transactionMatchesNetwork(transaction, chainId, networkId) {
  if (typeof transaction.chainId !== 'undefined') {
    return transaction.chainId === chainId;
  }
  return transaction.metamaskNetworkId === networkId;
}

/**
 * Determines if the maxFeePerGas and maxPriorityFeePerGas fields are supplied
 * and valid inputs. This will return false for non hex string inputs.
 *
 * @param {import("../constants/transaction").TransactionMeta} transaction -
 *  the transaction to check
 * @returns {boolean} true if transaction uses valid EIP1559 fields
 */
export function isEIP1559Transaction(transaction) {
  return (
    isHexString(transaction?.txParams?.maxFeePerGas) &&
    isHexString(transaction?.txParams?.maxPriorityFeePerGas)
  );
}

/**
 * Determine if the maxFeePerGas and maxPriorityFeePerGas fields are not
 * supplied and that the gasPrice field is valid if it is provided. This will
 * return false if gasPrice is a non hex string.
 *
 * @param {import("../constants/transaction").TransactionMeta} transaction -
 *  the transaction to check
 * @returns {boolean} true if transaction uses valid Legacy fields OR lacks
 *  EIP1559 fields
 */
export function isLegacyTransaction(transaction) {
  return (
    typeof transaction.txParams.maxFeePerGas === 'undefined' &&
    typeof transaction.txParams.maxPriorityFeePerGas === 'undefined' &&
    (typeof transaction.txParams.gasPrice === 'undefined' ||
      isHexString(transaction.txParams.gasPrice))
  );
}

/**
 * Determine if a transactions gas fees in txParams match those in its dappSuggestedGasFees property
 *
 * @param {import("../constants/transaction").TransactionMeta} transaction -
 *  the transaction to check
 * @returns {boolean} true if both the txParams and dappSuggestedGasFees are objects with truthy gas fee properties,
 *   and those properties are strictly equal
 */
export function txParamsAreDappSuggested(transaction) {
  const { gasPrice, maxPriorityFeePerGas, maxFeePerGas } =
    transaction?.txParams || {};
  return (
    (gasPrice && gasPrice === transaction?.dappSuggestedGasFees?.gasPrice) ||
    (maxPriorityFeePerGas &&
      maxFeePerGas &&
      transaction?.dappSuggestedGasFees?.maxPriorityFeePerGas ===
        maxPriorityFeePerGas &&
      transaction?.dappSuggestedGasFees?.maxFeePerGas === maxFeePerGas)
  );
}

/**
 * Determines the type of the transaction by analyzing the txParams.
 * This method will return one of the types defined in shared/constants/transactions
 * It will never return TRANSACTION_TYPE_CANCEL or TRANSACTION_TYPE_RETRY as these
 * represent specific events that we control from the extension and are added manually
 * at transaction creation.
 *
 * @param {Object} txParams - Parameters for the transaction
 * @param {EthQuery} query - EthQuery instance
 * @returns {InferTransactionTypeResult}
 */
export async function determineTransactionType(txParams, query) {
  const { data, to } = txParams;
  let name;
  try {
    name = data && hstInterface.parseTransaction({ data }).name;
  } catch (error) {
    log.debug('Failed to parse transaction data.', error, data);
  }

  const tokenMethodName = [
    TRANSACTION_TYPES.TOKEN_METHOD_APPROVE,
    TRANSACTION_TYPES.TOKEN_METHOD_TRANSFER,
    TRANSACTION_TYPES.TOKEN_METHOD_TRANSFER_FROM,
  ].find((methodName) => isEqualCaseInsensitive(methodName, name));

  let result;
  if (data && tokenMethodName) {
    result = tokenMethodName;
  } else if (data && !to) {
    result = TRANSACTION_TYPES.DEPLOY_CONTRACT;
  }

  let contractCode;

  if (!result) {
    const {
      contractCode: resultCode,
      isContractAddress,
    } = await readAddressAsContract(query, to);

    contractCode = resultCode;
    result = isContractAddress
      ? TRANSACTION_TYPES.CONTRACT_INTERACTION
      : TRANSACTION_TYPES.SIMPLE_SEND;
  }

  return { type: result, getCodeResponse: contractCode };
}

const INFERRABLE_TRANSACTION_TYPES = [
  TRANSACTION_TYPES.TOKEN_METHOD_APPROVE,
  TRANSACTION_TYPES.TOKEN_METHOD_TRANSFER,
  TRANSACTION_TYPES.TOKEN_METHOD_TRANSFER_FROM,
  TRANSACTION_TYPES.CONTRACT_INTERACTION,
  TRANSACTION_TYPES.SIMPLE_SEND,
];

/**
 * Given a transaction meta object, determine the asset type that the
 * transaction is dealing with, as well as the standard for the token if it
 * is a token transaction.
 *
 * @param {import('../constants/transaction').TransactionMeta} txMeta -
 *  transaction meta object
 * @param {EthQuery} query - EthQuery instance
 * @param {Function} getTokenStandardAndDetails - function to get token
 *  standards and details.
 * @returns {{ assetType: string, tokenStandard: string}}
 */
export async function determineTransactionAssetType(
  txMeta,
  query,
  getTokenStandardAndDetails,
) {
  // If the transaction type is already one of the inferrable types, then we do
  // not need to re-establish the type.
  let inferrableType = txMeta.type;
  if (INFERRABLE_TRANSACTION_TYPES.includes(txMeta.type) === false) {
    // Because we will deal with all types of transactions (including swaps)
    // we want to get an inferrable type of transaction that isn't special cased
    // that way we can narrow the number of logic gates required.
    const result = await determineTransactionType(txMeta.txParams, query);
    inferrableType = result.type;
  }

  const isTokenMethod = [
    TRANSACTION_TYPES.TOKEN_METHOD_APPROVE,
    TRANSACTION_TYPES.TOKEN_METHOD_TRANSFER,
    TRANSACTION_TYPES.TOKEN_METHOD_TRANSFER_FROM,
  ].find((methodName) => isEqualCaseInsensitive(methodName, inferrableType));

  if (isTokenMethod) {
    try {
      const details = await getTokenStandardAndDetails(
        txMeta.txParams.to,
        txMeta.txParams.from,
      );
      if (details.standard) {
        return {
          assetType:
            details.standard === TOKEN_STANDARDS.ERC20
              ? ASSET_TYPES.TOKEN
              : ASSET_TYPES.COLLECTIBLE,
          tokenStandard: details.standard,
        };
      }
    } catch {
      // noop
    }
  }

  // If the transaction is interacting with a contract but isn't a token method
  // we use the 'UNKNOWN' value to show that it isn't a transaction sending any
  // particular asset.
  if (inferrableType === TRANSACTION_TYPES.CONTRACT_INTERACTION) {
    return {
      assetType: ASSET_TYPES.UNKNOWN,
      tokenStandard: TOKEN_STANDARDS.NONE,
    };
  }
  return { assetType: ASSET_TYPES.NATIVE, tokenStandard: TOKEN_STANDARDS.NONE };
}
