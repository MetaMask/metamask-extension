import log from 'loglevel';
import { getTokenStandardAndDetails } from '../../store/actions';
import { isEqualCaseInsensitive } from '../../../shared/modules/string-utils';
import { parseStandardTokenTransactionData } from '../../../shared/modules/transaction.utils';
import { TokenStandard } from '../../../shared/constants/transaction';
import { getTokenValueParam } from '../../../shared/lib/metamask-controller-utils';
import { calcTokenAmount } from '../../../shared/lib/transactions-controller-utils';
import { Numeric } from '../../../shared/modules/Numeric';
import * as util from './util';
import { formatCurrency } from './confirm-tx.util';

const DEFAULT_SYMBOL = '';

async function getSymbolFromContract(tokenAddress) {
  const token = util.getContractAtAddress(tokenAddress);
  try {
    const result = await token.symbol();
    return result[0];
  } catch (error) {
    log.warn(
      `symbol() call for token at address ${tokenAddress} resulted in error:`,
      error,
    );
    return undefined;
  }
}

async function getDecimalsFromContract(tokenAddress) {
  const token = util.getContractAtAddress(tokenAddress);

  try {
    const result = await token.decimals();
    const decimalsBN = result[0];
    return decimalsBN?.toString();
  } catch (error) {
    log.warn(
      `decimals() call for token at address ${tokenAddress} resulted in error:`,
      error,
    );
    return undefined;
  }
}

export function getTokenMetadata(tokenAddress, tokenList) {
  return tokenAddress && tokenList[tokenAddress.toLowerCase()];
}

async function getSymbol(tokenAddress, tokenList) {
  let symbol = await getSymbolFromContract(tokenAddress);

  if (!symbol) {
    const contractMetadataInfo = getTokenMetadata(tokenAddress, tokenList);

    if (contractMetadataInfo) {
      symbol = contractMetadataInfo.symbol;
    }
  }

  return symbol;
}

async function getDecimals(tokenAddress, tokenList) {
  let decimals = await getDecimalsFromContract(tokenAddress);

  if (!decimals || decimals === '0') {
    const contractMetadataInfo = getTokenMetadata(tokenAddress, tokenList);

    if (contractMetadataInfo) {
      decimals = contractMetadataInfo.decimals?.toString();
    }
  }

  return decimals;
}

export async function getSymbolAndDecimals(tokenAddress, tokenList) {
  let symbol, decimals;

  try {
    symbol = await getSymbol(tokenAddress, tokenList);
    decimals = await getDecimals(tokenAddress, tokenList);
  } catch (error) {
    log.warn(
      `symbol() and decimal() calls for token at address ${tokenAddress} resulted in error:`,
      error,
    );
  }

  return {
    symbol: symbol || DEFAULT_SYMBOL,
    decimals,
  };
}

export function tokenInfoGetter() {
  const tokens = {};

  return async (address, tokenList) => {
    if (tokens[address]) {
      return tokens[address];
    }

    tokens[address] = await getSymbolAndDecimals(address, tokenList);

    return tokens[address];
  };
}

/**
 * Attempts to get the address parameter of the given token transaction data
 * (i.e. function call) per the Human Standard Token ABI, in the following
 * order:
 *   - The '_to' parameter, if present
 *   - The first parameter, if present
 *
 * @param {object} tokenData - ethers Interface token data.
 * @returns {string | undefined} A lowercase address string.
 */
export function getTokenAddressParam(tokenData = {}) {
  const value =
    tokenData?.args?._to || tokenData?.args?.to || tokenData?.args?.[0];
  return value?.toString().toLowerCase();
}

/**
 * Gets the '_value' parameter of the given token transaction data
 * (i.e function call) per the Human Standard Token ABI, if present.
 *
 * @param {object} tokenData - ethers Interface token data.
 * @returns {string | undefined} A decimal string value.
 */
/**
 * Gets either the '_tokenId' parameter or the 'id' param of the passed token transaction data.,
 * These are the parsed tokenId values returned by `parseStandardTokenTransactionData` as defined
 * in the ERC721 and ERC1155 ABIs from metamask-eth-abis (https://github.com/MetaMask/metamask-eth-abis/tree/main/src/abis)
 *
 * @param {object} tokenData - ethers Interface token data.
 * @returns {string | undefined} A decimal string value.
 */
export function getTokenIdParam(tokenData = {}) {
  return (
    tokenData?.args?._tokenId?.toString() ?? tokenData?.args?.id?.toString()
  );
}

/**
 * Gets the '_approved' parameter of the given token transaction data
 * (i.e function call) per the Human Standard Token ABI, if present.
 *
 * @param {object} tokenData - ethers Interface token data.
 * @returns {boolean | undefined} A boolean indicating whether the function is being called to approve or revoke access.
 */
export function getTokenApprovedParam(tokenData = {}) {
  return tokenData?.args?._approved;
}

/**
 * Get the token balance converted to fiat and optionally formatted for display
 *
 * @param {number} [contractExchangeRate] - The exchange rate between the current token and the native currency
 * @param {number} conversionRate - The exchange rate between the current fiat currency and the native currency
 * @param {string} currentCurrency - The currency code for the user's chosen fiat currency
 * @param {string} [tokenAmount] - The current token balance
 * @param {string} [tokenSymbol] - The token symbol
 * @param {boolean} [formatted] - Whether the return value should be formatted or not
 * @param {boolean} [hideCurrencySymbol] - excludes the currency symbol in the result if true
 * @returns {string|undefined} The token amount in the user's chosen fiat currency, optionally formatted and localize
 */
export function getTokenFiatAmount(
  contractExchangeRate,
  conversionRate,
  currentCurrency,
  tokenAmount,
  tokenSymbol,
  formatted = true,
  hideCurrencySymbol = false,
) {
  // If the conversionRate is 0 (i.e. unknown) or the contract exchange rate
  // is currently unknown, the fiat amount cannot be calculated so it is not
  // shown to the user
  if (
    conversionRate <= 0 ||
    !contractExchangeRate ||
    tokenAmount === undefined
  ) {
    return undefined;
  }

  const currentTokenToFiatRate = new Numeric(contractExchangeRate, 10)
    .times(new Numeric(conversionRate, 10))
    .toString();

  let currentTokenInFiat = new Numeric(tokenAmount, 10);

  if (tokenSymbol !== currentCurrency.toUpperCase() && currentTokenToFiatRate) {
    currentTokenInFiat = currentTokenInFiat.applyConversionRate(
      currentTokenToFiatRate,
    );
  }

  currentTokenInFiat = currentTokenInFiat.round(2).toString();
  let result;
  if (hideCurrencySymbol) {
    result = formatCurrency(currentTokenInFiat, currentCurrency);
  } else if (formatted) {
    result = `${formatCurrency(
      currentTokenInFiat,
      currentCurrency,
    )} ${currentCurrency.toUpperCase()}`;
  } else {
    result = currentTokenInFiat;
  }
  return result;
}

export async function getAssetDetails(
  tokenAddress,
  currentUserAddress,
  transactionData,
  existingCollectibles,
) {
  const tokenData = parseStandardTokenTransactionData(transactionData);
  if (!tokenData) {
    throw new Error('Unable to detect valid token data');
  }

  // Sometimes the tokenId value is parsed as "_value" param. Not seeing this often any more, but still occasionally:
  // i.e. call approve() on BAYC contract - https://etherscan.io/token/0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d#writeContract, and tokenId shows up as _value,
  // not sure why since it doesn't match the ERC721 ABI spec we use to parse these transactions - https://github.com/MetaMask/metamask-eth-abis/blob/d0474308a288f9252597b7c93a3a8deaad19e1b2/src/abis/abiERC721.ts#L62.
  let tokenId =
    getTokenIdParam(tokenData)?.toString() ?? getTokenValueParam(tokenData);

  const toAddress = getTokenAddressParam(tokenData);

  let tokenDetails;

  // if a tokenId is present check if there is a collectible in state matching the address/tokenId
  // and avoid unnecessary network requests to query token details we already have
  if (existingCollectibles?.length && tokenId) {
    const existingCollectible = existingCollectibles.find(
      ({ address, tokenId: _tokenId }) =>
        isEqualCaseInsensitive(tokenAddress, address) && _tokenId === tokenId,
    );

    if (existingCollectible) {
      return {
        toAddress,
        ...existingCollectible,
      };
    }
  }

  try {
    tokenDetails = await getTokenStandardAndDetails(
      tokenAddress,
      currentUserAddress,
      tokenId,
    );
  } catch (error) {
    log.warn(error);
    // if we can't determine any token standard or details return the data we can extract purely from the parsed transaction data
    return { toAddress, tokenId };
  }

  const tokenAmount =
    tokenData &&
    tokenDetails?.decimals &&
    calcTokenAmount(
      getTokenValueParam(tokenData),
      tokenDetails?.decimals,
    ).toString(10);

  const decimals =
    tokenDetails?.decimals && Number(tokenDetails.decimals?.toString(10));

  if (tokenDetails?.standard === TokenStandard.ERC20) {
    tokenId = undefined;
  }

  // else if not a collectible already in state or standard === ERC20 return tokenDetails and tokenId
  return {
    tokenAmount,
    toAddress,
    decimals,
    tokenId,
    ...tokenDetails,
  };
}
