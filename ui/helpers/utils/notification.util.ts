import { BigNumber } from 'bignumber.js';
import { JsonRpcProvider } from '@ethersproject/providers';
import type { NotificationServicesController } from '@metamask/notification-services-controller';
import { TextVariant } from '../constants/design-system';
import {
  CHAIN_IDS,
  CHAIN_ID_TO_CURRENCY_SYMBOL_MAP,
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  NETWORK_TO_NAME_MAP,
  FEATURED_RPCS,
  MAINNET_RPC_URL,
  GOERLI_RPC_URL,
  SEPOLIA_RPC_URL,
  LINEA_GOERLI_RPC_URL,
  LINEA_SEPOLIA_RPC_URL,
  LINEA_MAINNET_RPC_URL,
  LOCALHOST_RPC_URL,
} from '../../../shared/constants/network';
import { SUPPORTED_NOTIFICATION_BLOCK_EXPLORERS } from '../constants/metamask-notifications/metamask-notifications';
import { calcTokenAmount } from '../../../shared/lib/transactions-controller-utils';
import type { BlockExplorerConfig } from '../constants/metamask-notifications/metamask-notifications';
import {
  hexWEIToDecGWEI,
  hexWEIToDecETH,
  decimalToHex,
} from '../../../shared/modules/conversion.utils';

type OnChainRawNotification =
  NotificationServicesController.Types.OnChainRawNotification;
type OnChainRawNotificationsWithNetworkFields =
  NotificationServicesController.Types.OnChainRawNotificationsWithNetworkFields;

/**
 * Type guard to ensure a key is present in an object.
 *
 * @param object - The object to check.
 * @param key - The key to check for.
 * @returns True if the key is present, false otherwise.
 */
function isKey<T extends object>(object: T, key: PropertyKey): key is keyof T {
  return key in object;
}

/**
 * Checks if 2 date objects are on the same day
 *
 * @param currentDate
 * @param dateToCheck
 * @returns boolean if dates are same day.
 */
const isSameDay = (currentDate: Date, dateToCheck: Date) =>
  currentDate.getFullYear() === dateToCheck.getFullYear() &&
  currentDate.getMonth() === dateToCheck.getMonth() &&
  currentDate.getDate() === dateToCheck.getDate();

/**
 * Checks if a date is "yesterday" from the current date
 *
 * @param currentDate
 * @param dateToCheck
 * @returns boolean if dates were "yesterday"
 */
const isYesterday = (currentDate: Date, dateToCheck: Date) => {
  const yesterday = new Date(currentDate);
  yesterday.setDate(currentDate.getDate() - 1);
  return isSameDay(yesterday, dateToCheck);
};

/**
 * Checks if 2 date objects are in the same year.
 *
 * @param currentDate
 * @param dateToCheck
 * @returns boolean if dates were in same year
 */
const isSameYear = (currentDate: Date, dateToCheck: Date) =>
  currentDate.getFullYear() === dateToCheck.getFullYear();

/**
 * Formats a given date into different formats based on how much time has elapsed since that date.
 *
 * @param date - The date to be formatted.
 * @returns The formatted date.
 */
export function formatMenuItemDate(date: Date) {
  const currentDate = new Date();

  // E.g. 12:21
  if (isSameDay(currentDate, date)) {
    return new Intl.DateTimeFormat('en', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    }).format(date);
  }

  // E.g. Yesterday
  if (isYesterday(currentDate, date)) {
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      -1,
      'day',
    );
  }

  // E.g. 21 Oct
  if (isSameYear(currentDate, date)) {
    return new Intl.DateTimeFormat('en', {
      month: 'short',
      day: 'numeric',
    }).format(date);
  }

  // E.g. 21 Oct 2022
  return new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

type FormatOptions = {
  decimalPlaces?: number;
  shouldEllipse?: boolean;
};
const defaultFormatOptions = {
  decimalPlaces: 4,
};

/**
 * Calculates the number of leading zeros in the fractional part of a number.
 *
 * This function converts a number or a string representation of a number into
 * its decimal form and then counts the number of leading zeros present in the
 * fractional part of the number. This is useful for determining the precision
 * of very small numbers.
 *
 * @param num - The number to analyze, which can be in the form
 * of a number or a string.
 * @returns The count of leading zeros in the fractional part of the number.
 */
export const getLeadingZeroCount = (num: number | string) => {
  const numToString = new BigNumber(num, 10).toString(10);
  const fractionalPart = numToString.split('.')[1] ?? '';
  return fractionalPart.match(/^0*/u)?.[0]?.length || 0;
};

/**
 * This formats a number using Intl
 * It abbreviates large numbers (using K, M, B, T)
 * And abbreviates small numbers in 2 ways:
 * - Will format to the given number of decimal places
 * - Will format up to 4 decimal places
 * - Will ellipse the number if longer than given decimal places
 *
 * @param numericAmount
 * @param opts
 * @returns
 */
export const formatAmount = (numericAmount: number, opts?: FormatOptions) => {
  // create options with defaults
  const options = { ...defaultFormatOptions, ...opts };

  const leadingZeros = getLeadingZeroCount(numericAmount);
  const isDecimal =
    numericAmount.toString().includes('.') ||
    leadingZeros > 0 ||
    numericAmount.toString().includes('e-');
  const isLargeNumber = numericAmount > 999;

  const handleShouldEllipse = (decimalPlaces: number) =>
    Boolean(options?.shouldEllipse) && leadingZeros >= decimalPlaces;

  if (isLargeNumber) {
    return Intl.NumberFormat('en-US', {
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 2,
    }).format(numericAmount);
  }

  if (isDecimal) {
    const ellipse = handleShouldEllipse(options.decimalPlaces);
    const formattedValue = Intl.NumberFormat('en-US', {
      minimumFractionDigits: ellipse ? options.decimalPlaces : undefined,
      maximumFractionDigits: options.decimalPlaces,
    }).format(numericAmount);

    return ellipse ? `${formattedValue}...` : formattedValue;
  }

  // Default to showing the raw amount
  return numericAmount.toString();
};

/**
 * Generates a unique key based on the provided text, index, and a random string.
 *
 * @param text - The text to be included in the key.
 * @param index - The index to be included in the key.
 * @returns The generated unique key.
 */
export const getRandomKey = (text: string, index: number) => {
  const key = `${text
    .replace(/\s+/gu, '_')
    .replace(/[^\w-]/gu, '')}-${index}-${Math.random()
    .toString(36)
    .substring(2, 15)}`;

  return key;
};

/**
 * Creates an array of text items with highlighting applied to every second item.
 *
 * This function takes an array of strings and a variant type, and returns an object containing
 * the array of items where each item is an object with the text and a boolean indicating if it
 * should be highlighted. Highlighting is applied to every second item in the array.
 *
 * @param texts - An array of strings to be transformed into text items.
 * @param variant - The variant type that applies a specific styling or type classification.
 * @returns An object containing the array of text items and the variant.
 */
export const createTextItems = (texts: string[], variant: TextVariant) => {
  const items = texts.map((text, index) => ({
    text,
    highlighted: index % 2 === 1,
  }));
  return {
    items,
    variant,
  };
};

/**
 * Converts a token amount from its smallest unit based on its decimals to a human-readable format,
 * applying formatting options such as decimal places and ellipsis for overflow.
 *
 * @param amount - The token amount in its smallest unit as a string.
 * @param decimals - The number of decimals the token uses.
 * @param options - Optional formatting options to specify the number of decimal places and whether to use ellipsis.
 * @returns The formatted token amount as a string. If the input is invalid, returns an empty string.
 */
export const getAmount = (
  amount: string,
  decimals: string,
  options?: FormatOptions,
) => {
  if (!amount || !decimals) {
    return '';
  }

  const numericAmount = calcTokenAmount(
    amount,
    parseFloat(decimals),
  ).toNumber();

  return formatAmount(numericAmount, options);
};

/**
 * Converts a token amount and its USD conversion rate to a formatted USD string.
 *
 * This function first converts the token amount from its smallest unit based on the provided decimals
 * to a human-readable format. It then multiplies this amount by the USD conversion rate to get the
 * equivalent amount in USD, and formats this USD amount into a readable string.
 *
 * @param amount - The token amount in its smallest unit as a string.
 * @param decimals - The number of decimals the token uses.
 * @param usd - The current USD conversion rate for the token.
 * @returns The formatted USD amount as a string. If any input is invalid, returns an empty string.
 */
export const getUsdAmount = (amount: string, decimals: string, usd: string) => {
  if (!amount || !decimals || !usd) {
    return '';
  }

  const amountInEther = calcTokenAmount(
    amount,
    parseFloat(decimals),
  ).toNumber();
  const numericAmount = parseFloat(`${amountInEther}`) * parseFloat(usd);

  return formatAmount(numericAmount);
};

/**
 * Retrieves the network name associated with a given chain ID.
 *
 * This function looks up the chain ID in a predefined map (`NETWORK_TO_NAME_MAP`)
 * to find the corresponding network name. If the chain ID is not found, it returns undefined.
 *
 * @param chainId - The chain ID for which the network name is required.
 * @returns The name of the network as a string, or undefined if the chain ID is not recognized.
 */
export const getNetworkNameByChainId = (
  chainId: string,
): string | undefined => {
  return NETWORK_TO_NAME_MAP[chainId as keyof typeof NETWORK_TO_NAME_MAP];
};

/**
 * Retrieves detailed information about a network based on its chain ID.
 * This includes the native currency's name, symbol, logo, a default address, and optionally a block explorer URL.
 *
 * @param chainId - The chain ID of the network for which details are required.
 * @returns An object containing details about the network:
 * - nativeCurrencyName: The name of the native currency.
 * - nativeCurrencySymbol: The symbol of the native currency.
 * - nativeCurrencyLogo: The logo URL of the native currency.
 * - nativeCurrencyAddress: A default address, typically the zero address.
 * - nativeBlockExplorerUrl: The URL of the block explorer associated with the network, if available.
 */
export function getNetworkDetailsByChainId(chainId?: keyof typeof CHAIN_IDS): {
  nativeCurrencyName: string;
  nativeCurrencySymbol: string;
  nativeCurrencyLogo: string;
  nativeCurrencyAddress: string;
  blockExplorerConfig?: BlockExplorerConfig;
} {
  const fullNativeCurrencyName =
    NETWORK_TO_NAME_MAP[chainId as keyof typeof NETWORK_TO_NAME_MAP] ?? '';
  const nativeCurrencyName = fullNativeCurrencyName.split(' ')[0] ?? '';
  const nativeCurrencySymbol =
    CHAIN_ID_TO_CURRENCY_SYMBOL_MAP[
      chainId as keyof typeof CHAIN_ID_TO_CURRENCY_SYMBOL_MAP
    ];
  const nativeCurrencyLogo =
    CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
      chainId as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP
    ];
  const nativeCurrencyAddress = '0x0000000000000000000000000000000000000000';
  const blockExplorerConfig =
    chainId && isKey(SUPPORTED_NOTIFICATION_BLOCK_EXPLORERS, chainId)
      ? SUPPORTED_NOTIFICATION_BLOCK_EXPLORERS[chainId]
      : undefined;
  return {
    nativeCurrencyName,
    nativeCurrencySymbol,
    nativeCurrencyLogo,
    nativeCurrencyAddress,
    blockExplorerConfig,
  };
}

/**
 * Formats an ISO date string into a more readable format.
 *
 * @param isoDateString - The ISO date string to format.
 * @returns The formatted date string.
 */
export function formatIsoDateString(isoDateString: string) {
  const date = new Date(isoDateString);

  const options = {
    year: 'numeric' as const,
    month: 'short' as const,
    day: 'numeric' as const,
    hour: 'numeric' as const,
    minute: 'numeric' as const,
    hour12: true,
  };

  const formattedDate = new Intl.DateTimeFormat('en-US', options).format(date);

  return formattedDate;
}

export type HexChainId = (typeof CHAIN_IDS)[keyof typeof CHAIN_IDS];

/**
 * Retrieves the RPC URL associated with a given chain ID.
 *
 * This function searches through the FEATURED_RPCS array to find a matching RPC configuration
 * for the provided chain ID. It returns the RPC URL if a match is found, otherwise undefined.
 *
 * @param chainId - The chain ID for which the RPC URL is required.
 * @returns The RPC URL associated with the given chain ID, or undefined if no match is found.
 */
export function getRpcUrlByChainId(chainId: HexChainId): string {
  const rpc = FEATURED_RPCS.find((rpcItem) => rpcItem.chainId === chainId);

  // If rpc is found, return its URL. Otherwise, return a default URL based on the chainId.
  if (rpc) {
    return rpc.rpcUrl;
  }
  // Fallback RPC URLs based on the chainId
  switch (chainId) {
    case CHAIN_IDS.MAINNET:
      return MAINNET_RPC_URL;
    case CHAIN_IDS.GOERLI:
      return GOERLI_RPC_URL;
    case CHAIN_IDS.SEPOLIA:
      return SEPOLIA_RPC_URL;
    case CHAIN_IDS.LINEA_GOERLI:
      return LINEA_GOERLI_RPC_URL;
    case CHAIN_IDS.LINEA_SEPOLIA:
      return LINEA_SEPOLIA_RPC_URL;
    case CHAIN_IDS.LINEA_MAINNET:
      return LINEA_MAINNET_RPC_URL;
    case CHAIN_IDS.LOCALHOST:
      return LOCALHOST_RPC_URL;
    default:
      // Default to MAINNET if no match is found
      return MAINNET_RPC_URL;
  }
}

export function hasNetworkFeeFields(
  notification: OnChainRawNotification,
): notification is OnChainRawNotificationsWithNetworkFields {
  return 'network_fee' in notification.data;
}

export const getNetworkFees = async (notification: OnChainRawNotification) => {
  if (!hasNetworkFeeFields(notification)) {
    throw new Error('Invalid notification type');
  }

  const chainId = decimalToHex(notification.chain_id);
  const rpcUrl = getRpcUrlByChainId(`0x${chainId}` as HexChainId);
  const connection = {
    url: rpcUrl,
    headers: {
      'Infura-Source': 'metamask/metamask',
    },
  };
  const provider = new JsonRpcProvider(connection);

  if (!provider) {
    throw new Error(`No provider found for chainId ${chainId}`);
  }

  try {
    const [receipt, transaction, block] = await Promise.all([
      provider.getTransactionReceipt(notification.tx_hash),
      provider.getTransaction(notification.tx_hash),
      provider.getBlock(notification.block_number),
    ]);

    const calculateUsdAmount = (value: string, decimalPlaces?: number) =>
      formatAmount(
        parseFloat(value) *
          parseFloat(notification.data.network_fee.native_token_price_in_usd),
        {
          decimalPlaces: decimalPlaces || 4,
        },
      );

    const transactionFeeInEth = hexWEIToDecETH(
      receipt.gasUsed.mul(receipt.effectiveGasPrice)._hex,
    );
    const transactionFeeInUsd = calculateUsdAmount(transactionFeeInEth);

    const gasLimit = transaction.gasLimit.toNumber();
    const gasUsed = receipt.gasUsed.toNumber();

    const baseFee = block.baseFeePerGas
      ? hexWEIToDecGWEI(block.baseFeePerGas._hex)
      : null;
    const priorityFee = block.baseFeePerGas
      ? hexWEIToDecGWEI(receipt.effectiveGasPrice.sub(block.baseFeePerGas)._hex)
      : null;

    const maxFeePerGas = transaction.maxFeePerGas
      ? hexWEIToDecGWEI(transaction.maxFeePerGas._hex)
      : null;

    return {
      transactionFeeInEth,
      transactionFeeInUsd,
      gasLimit,
      gasUsed,
      baseFee,
      priorityFee,
      maxFeePerGas,
    };
  } catch (error) {
    throw new Error(
      `Error fetching network fees for chainId ${chainId}: ${error}`,
    );
  }
};

/**
 * Checks if a given URL is an IPFS URL.
 *
 * @param url - The URL to check.
 * @returns True if the URL is an IPFS URL, false otherwise.
 */
export const isIpfsURL = (url: string): boolean => {
  return url.startsWith('ipfs://');
};
