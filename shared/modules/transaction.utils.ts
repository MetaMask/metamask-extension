import { isHexString } from 'ethereumjs-util';
import { Interface } from '@ethersproject/abi';
import {
  abiERC721,
  abiERC20,
  abiERC1155,
  abiFiatTokenV2,
} from '@metamask/metamask-eth-abis';
import type EthQuery from '@metamask/eth-query';
import log from 'loglevel';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import type { TransactionParams } from '@metamask/transaction-controller';

import { Hex } from '@metamask/utils';
import { AssetType, TokenStandard } from '../constants/transaction';
import { readAddressAsContract } from './contract-utils';
import { isEqualCaseInsensitive } from './string-utils';

const INFERRABLE_TRANSACTION_TYPES: TransactionType[] = [
  TransactionType.tokenMethodApprove,
  TransactionType.tokenMethodSetApprovalForAll,
  TransactionType.tokenMethodTransfer,
  TransactionType.tokenMethodTransferFrom,
  TransactionType.tokenMethodIncreaseAllowance,
  TransactionType.contractInteraction,
  TransactionType.simpleSend,
];

type InferTransactionTypeResult = {
  // The type of transaction
  type: TransactionType;
  // The contract code, in hex format if it exists. '0x0' or '0x' are also indicators of non-existent contract code
  getCodeResponse: string | null | undefined;
};

const erc20Interface = new Interface(abiERC20);
const erc721Interface = new Interface(abiERC721);
const erc1155Interface = new Interface(abiERC1155);
const USDCInterface = new Interface(abiFiatTokenV2);

/**
 * Determines if the maxFeePerGas and maxPriorityFeePerGas fields are supplied
 * and valid inputs. This will return false for non hex string inputs.
 *
 * @param transactionMeta - the transaction to check
 * @returns boolean true if transaction uses valid EIP1559 fields
 */
export function isEIP1559Transaction(
  transactionMeta: TransactionMeta,
): boolean {
  return (
    isHexString(transactionMeta?.txParams?.maxFeePerGas ?? '') &&
    isHexString(transactionMeta?.txParams?.maxPriorityFeePerGas ?? '')
  );
}

/**
 * Determine if the maxFeePerGas and maxPriorityFeePerGas fields are not
 * supplied and that the gasPrice field is valid if it is provided. This will
 * return false if gasPrice is a non hex string.
 *
 * @param transactionMeta - the transaction to check
 * @returns boolean true if transaction uses valid Legacy fields OR lacks EIP1559 fields
 */
export function isLegacyTransaction(transactionMeta: TransactionMeta): boolean {
  return (
    typeof transactionMeta.txParams.maxFeePerGas === 'undefined' &&
    typeof transactionMeta.txParams.maxPriorityFeePerGas === 'undefined' &&
    (typeof transactionMeta.txParams.gasPrice === 'undefined' ||
      isHexString(transactionMeta.txParams.gasPrice))
  );
}

/**
 * Determine if a transactions gas fees in txParams match those in its dappSuggestedGasFees property
 *
 * @param  transactionMeta - the transaction to check
 * @returns boolean - true if both the txParams and dappSuggestedGasFees are objects with truthy gas fee properties,
 * and those properties are strictly equal
 */
export function txParamsAreDappSuggested(
  transactionMeta: TransactionMeta,
): boolean {
  const { gasPrice, maxPriorityFeePerGas, maxFeePerGas } =
    transactionMeta?.txParams || {};
  return Boolean(
    (gasPrice &&
      gasPrice === transactionMeta?.dappSuggestedGasFees?.gasPrice) ||
      (maxPriorityFeePerGas &&
        maxFeePerGas &&
        transactionMeta?.dappSuggestedGasFees?.maxPriorityFeePerGas ===
          maxPriorityFeePerGas &&
        transactionMeta?.dappSuggestedGasFees?.maxFeePerGas === maxFeePerGas),
  );
}

/**
 * Attempts to decode transaction data using ABIs for three different token standards: ERC20, ERC721, ERC1155.
 * The data will decode correctly if the transaction is an interaction with a contract that matches one of these
 * contract standards
 *
 * @param data - encoded transaction data
 * @returns TransactionDescription | undefined
 */
export function parseStandardTokenTransactionData(data: string) {
  try {
    return erc20Interface.parseTransaction({ data });
  } catch {
    // ignore and next try to parse with erc721 ABI
  }

  try {
    return erc721Interface.parseTransaction({ data });
  } catch {
    // ignore and next try to parse with erc1155 ABI
  }

  try {
    return erc1155Interface.parseTransaction({ data });
  } catch {
    // ignore and return undefined
  }

  try {
    return USDCInterface.parseTransaction({ data });
  } catch {
    // ignore and return undefined
  }

  return undefined;
}

/**
 * Determines the type of the transaction by analyzing the txParams.
 * This method will return one of the types defined in {@link TransactionType}
 * It will never return TRANSACTION_TYPE_CANCEL or TRANSACTION_TYPE_RETRY as these
 * represent specific events that we control from the extension and are added manually
 * at transaction creation.
 *
 * @param txParams - Parameters for the transaction
 * @param query - EthQuery instance
 * @returns InferTransactionTypeResult
 */
export async function determineTransactionType(
  txParams: TransactionParams,
  query: EthQuery,
): Promise<InferTransactionTypeResult> {
  const { data, to } = txParams;
  let contractCode: string | null | undefined;

  if (data && !to) {
    return {
      type: TransactionType.deployContract,
      getCodeResponse: contractCode,
    };
  }
  if (to) {
    const { contractCode: resultCode, isContractAddress } =
      await readAddressAsContract(query, to);

    contractCode = resultCode;

    if (isContractAddress) {
      const hasValue = txParams.value && Number(txParams.value) !== 0;

      let name: string = '';
      try {
        const parsedData = data
          ? parseStandardTokenTransactionData(data)
          : undefined;
        if (parsedData?.name) {
          name = parsedData.name;
        }
      } catch (error) {
        log.debug('Failed to parse transaction data.', error, data);
      }

      const tokenMethodName = [
        TransactionType.tokenMethodApprove,
        TransactionType.tokenMethodSetApprovalForAll,
        TransactionType.tokenMethodTransfer,
        TransactionType.tokenMethodTransferFrom,
        TransactionType.tokenMethodIncreaseAllowance,
        TransactionType.tokenMethodSafeTransferFrom,
      ].find((methodName) => isEqualCaseInsensitive(methodName, name));
      return {
        type:
          data && tokenMethodName && !hasValue
            ? tokenMethodName
            : TransactionType.contractInteraction,
        getCodeResponse: contractCode,
      };
    }
  }

  return { type: TransactionType.simpleSend, getCodeResponse: contractCode };
}

type GetTokenStandardAndDetails = (to: string | undefined) => Promise<{
  decimals?: string;
  balance?: string;
  symbol?: string;
  standard?: TokenStandard;
}>;
/**
 * Given a transaction meta object, determine the asset type that the
 * transaction is dealing with, as well as the standard for the token if it
 * is a token transaction.
 *
 * @param txMeta - transaction meta object
 * @param query - EthQuery instance
 * @param getTokenStandardAndDetails - function to get token standards and details.
 * @returns assetType: AssetType, tokenStandard: TokenStandard
 */
export async function determineTransactionAssetType(
  txMeta: TransactionMeta,
  query: EthQuery,
  getTokenStandardAndDetails: GetTokenStandardAndDetails,
): Promise<{
  assetType: AssetType;
  tokenStandard: TokenStandard;
}> {
  // If the transaction type is already one of the inferrable types, then we do
  // not need to re-establish the type.
  let inferrableType = txMeta.type;
  if (txMeta.type && !INFERRABLE_TRANSACTION_TYPES.includes(txMeta.type)) {
    // Because we will deal with all types of transactions (including swaps)
    // we want to get an inferrable type of transaction that isn't special cased
    // that way we can narrow the number of logic gates required.
    const result = await determineTransactionType(txMeta.txParams, query);
    inferrableType = result.type;
  }

  // If the inferred type of the transaction is one of those that are part of
  // the token contract standards, we can use the getTokenStandardAndDetails
  // method to get the asset type.
  const isTokenMethod = [
    TransactionType.tokenMethodApprove,
    TransactionType.tokenMethodSetApprovalForAll,
    TransactionType.tokenMethodTransfer,
    TransactionType.tokenMethodTransferFrom,
    TransactionType.tokenMethodIncreaseAllowance,
  ].find((methodName) => methodName === inferrableType);

  if (
    isTokenMethod ||
    // We can also check any contract interaction type to see if the to address
    // is a token contract. If it isn't, then the method will throw and we can
    // fall through to the other checks.
    inferrableType === TransactionType.contractInteraction
  ) {
    try {
      // We don't need a balance check, so the second parameter to
      // getTokenStandardAndDetails is omitted.
      const details = await getTokenStandardAndDetails(txMeta.txParams.to);
      if (details.standard) {
        return {
          assetType:
            details.standard === TokenStandard.ERC20
              ? AssetType.token
              : AssetType.NFT,
          tokenStandard: details.standard,
        };
      }
    } catch {
      // noop, We expect errors here but we don't need to report them or do
      // anything in response.
    }
  }

  // If the transaction is interacting with a contract but isn't a token method
  // we use the 'UNKNOWN' value to show that it isn't a transaction sending any
  // particular asset.
  if (inferrableType === TransactionType.contractInteraction) {
    return {
      assetType: AssetType.unknown,
      tokenStandard: TokenStandard.none,
    };
  }
  return { assetType: AssetType.native, tokenStandard: TokenStandard.none };
}

const REGEX_MESSAGE_VALUE_LARGE =
  /"message"\s*:\s*\{[^}]*"value"\s*:\s*(\d{15,})/u;

function extractLargeMessageValue(dataToParse: string): string | undefined {
  if (typeof dataToParse !== 'string') {
    return undefined;
  }
  return dataToParse.match(REGEX_MESSAGE_VALUE_LARGE)?.[1];
}

/**
 * JSON.parse has a limitation which coerces values to scientific notation if numbers are greator than
 * Number.MAX_SAFE_INTEGER. This can cause a loss in precision.
 *
 * Aside from precision concerns, if the value returned was a large number greator than 15 digits,
 * e.g. 3.000123123123121e+26, passing the value to BigNumber will throw the error:
 * Error: new BigNumber() number type has more than 15 significant digits
 *
 * Note that using JSON.parse reviver cannot help since the value will be coerced by the time it
 * reaches the reviver function.
 *
 * This function has a workaround to extract the large value from the message and replace
 * the message value with the string value.
 *
 * @param dataToParse
 * @returns
 */
export const parseTypedDataMessage = (dataToParse: string) => {
  const result = JSON.parse(dataToParse);

  const messageValue = extractLargeMessageValue(dataToParse);
  if (result.message?.value) {
    result.message.value = messageValue || String(result.message.value);
  }

  return result;
};

export function hasTransactionData(transactionData?: Hex): boolean {
  return Boolean(
    transactionData?.length && transactionData?.toLowerCase?.() !== '0x',
  );
}
