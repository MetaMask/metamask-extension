import { isHexString } from 'ethereumjs-util';
import { Interface } from '@ethersproject/abi';
import {
  abiERC721,
  abiERC20,
  abiERC1155,
  abiFiatTokenV2,
} from '@metamask/metamask-eth-abis';
import log from 'loglevel';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import type { TransactionParams } from '@metamask/transaction-controller';
import type { Provider } from '@metamask/network-controller';

import { Hex, JsonRpcParams } from '@metamask/utils';
import { BigNumber } from 'bignumber.js';
import {
  APPROVAL_METHOD_NAMES,
  AssetType,
  TokenStandard,
} from '../constants/transaction';
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

const ABI_PERMIT_2_APPROVE = {
  inputs: [
    { internalType: 'address', name: 'token', type: 'address' },
    { internalType: 'address', name: 'spender', type: 'address' },
    { internalType: 'uint160', name: 'amount', type: 'uint160' },
    { internalType: 'uint48', name: 'expiration', type: 'uint48' },
  ],
  name: 'approve',
  outputs: [],
  stateMutability: 'nonpayable',
  type: 'function',
};

type InferTransactionTypeResult = {
  // The type of transaction
  type: TransactionType;
  // The contract code, in hex format if it exists. '0x0' or '0x' are also indicators of non-existent contract code
  getCodeResponse: string | null | undefined;
};

type DataMessageParam = object | string | number | boolean | JsonRpcParams;

const erc20Interface = new Interface(abiERC20);
const erc721Interface = new Interface(abiERC721);
const erc1155Interface = new Interface(abiERC1155);
const USDCInterface = new Interface(abiFiatTokenV2);
const permit2Interface = new Interface([ABI_PERMIT_2_APPROVE]);

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
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
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
  const interfaces = [
    erc20Interface,
    erc721Interface,
    erc1155Interface,
    USDCInterface,
    permit2Interface,
  ];

  for (const iface of interfaces) {
    try {
      return iface.parseTransaction({ data });
    } catch {
      // Intentionally empty
    }
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
 * @param provider - Provider instance
 * @returns InferTransactionTypeResult
 */
export async function determineTransactionType(
  txParams: TransactionParams,
  provider: Provider,
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
      await readAddressAsContract(provider, to);

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
 * @param provider - Provider instance
 * @param getTokenStandardAndDetails - function to get token standards and details.
 * @returns assetType: AssetType, tokenStandard: TokenStandard
 */
export async function determineTransactionAssetType(
  txMeta: TransactionMeta,
  provider: Provider,
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
    const result = await determineTransactionType(txMeta.txParams, provider);
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
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
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
 * JSON.parse has a limitation which coerces values to scientific notation if numbers are greater than
 * Number.MAX_SAFE_INTEGER. This can cause a loss in precision.
 *
 * Aside from precision concerns, if the value returned was a large number greater than 15 digits,
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
export const parseTypedDataMessage = (dataToParse: DataMessageParam) => {
  const result =
    typeof dataToParse === 'object'
      ? dataToParse
      : JSON.parse(String(dataToParse));

  const messageValue = extractLargeMessageValue(String(dataToParse));

  if (result.message?.value) {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    result.message.value = messageValue || String(result.message.value);
  }

  return result;
};

export function hasTransactionData(transactionData?: Hex): boolean {
  return Boolean(
    transactionData?.length && transactionData?.toLowerCase?.() !== '0x',
  );
}

export function parseApprovalTransactionData(data: Hex):
  | {
      amountOrTokenId?: BigNumber;
      isApproveAll?: boolean;
      isRevokeAll?: boolean;
      name: string;
      tokenAddress?: Hex;
      spender?: Hex;
    }
  | undefined {
  const transactionDescription = parseStandardTokenTransactionData(data);
  const { args, name } = transactionDescription ?? {};

  if (!APPROVAL_METHOD_NAMES.includes(name ?? '') || !name) {
    return undefined;
  }

  const rawAmountOrTokenId =
    args?._value ?? // ERC-20 - approve
    args?.increment ?? // Fiat Token V2 - increaseAllowance
    args?.amount; // Permit2 - approve

  const amountOrTokenId = rawAmountOrTokenId
    ? new BigNumber(rawAmountOrTokenId?.toString())
    : undefined;

  const spender = args?.spender ?? args?._spender ?? args?.[0];

  const isApproveAll = name === 'setApprovalForAll' && args?._approved === true;
  const isRevokeAll = name === 'setApprovalForAll' && args?._approved === false;
  const tokenAddress = name === 'approve' ? args?.token : undefined;

  return {
    amountOrTokenId,
    isApproveAll,
    isRevokeAll,
    name,
    tokenAddress,
    spender,
  };
}
