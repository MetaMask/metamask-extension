import urlLib from 'url';
import { AccessList } from '@ethereumjs/tx';
import BN from 'bn.js';
import { memoize } from 'lodash';
import {
  TransactionEnvelopeType,
  TransactionMeta,
} from '@metamask/transaction-controller';
import {
  ENVIRONMENT_TYPE_BACKGROUND,
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_NOTIFICATION,
  ENVIRONMENT_TYPE_POPUP,
  PLATFORM_BRAVE,
  PLATFORM_CHROME,
  PLATFORM_EDGE,
  PLATFORM_FIREFOX,
  PLATFORM_OPERA,
} from '../../../shared/constants/app';
import { CHAIN_IDS, TEST_CHAINS } from '../../../shared/constants/network';
import { stripHexPrefix } from '../../../shared/modules/hexstring-utils';
import { getMethodDataAsync } from '../../../shared/lib/four-byte';

/**
 * @see {@link getEnvironmentType}
 */
const getEnvironmentTypeMemo = memoize((url) => {
  const parsedUrl = new URL(url);
  if (parsedUrl.pathname === '/popup.html') {
    return ENVIRONMENT_TYPE_POPUP;
  } else if (['/home.html'].includes(parsedUrl.pathname)) {
    return ENVIRONMENT_TYPE_FULLSCREEN;
  } else if (parsedUrl.pathname === '/notification.html') {
    return ENVIRONMENT_TYPE_NOTIFICATION;
  }
  return ENVIRONMENT_TYPE_BACKGROUND;
});

/**
 * Returns the window type for the application
 *
 * - `popup` refers to the extension opened through the browser app icon (in top right corner in chrome and firefox)
 * - `fullscreen` refers to the main browser window
 * - `notification` refers to the popup that appears in its own window when taking action outside of metamask
 * - `background` refers to the background page
 *
 * NOTE: This should only be called on internal URLs.
 *
 * @param [url] - the URL of the window
 * @returns the environment ENUM
 */
const getEnvironmentType = (url = window.location.href) =>
  getEnvironmentTypeMemo(url);

/**
 * Returns the platform (browser) where the extension is running.
 *
 * @returns the platform ENUM
 */
const getPlatform = () => {
  const { navigator } = window;
  const { userAgent } = navigator;

  if (userAgent.includes('Firefox')) {
    return PLATFORM_FIREFOX;
  } else if ('brave' in navigator) {
    return PLATFORM_BRAVE;
  } else if (userAgent.includes('Edg/')) {
    return PLATFORM_EDGE;
  } else if (userAgent.includes('OPR')) {
    return PLATFORM_OPERA;
  }
  return PLATFORM_CHROME;
};

/**
 * Converts a hex string to a BN object
 *
 * @param inputHex - A number represented as a hex string
 * @returns A BN object
 */
function hexToBn(inputHex: string) {
  return new BN(stripHexPrefix(inputHex), 16);
}

/**
 * Used to multiply a BN by a fraction
 *
 * @param targetBN - The number to multiply by a fraction
 * @param numerator - The numerator of the fraction multiplier
 * @param denominator - The denominator of the fraction multiplier
 * @returns The product of the multiplication
 */
function BnMultiplyByFraction(
  targetBN: BN,
  numerator: number,
  denominator: number,
) {
  const numBN = new BN(numerator);
  const denomBN = new BN(denominator);
  return targetBN.mul(numBN).div(denomBN);
}

/**
 * Prefixes a hex string with '0x' or '-0x' and returns it. Idempotent.
 *
 * @param str - The string to prefix.
 * @returns The prefixed string.
 */
const addHexPrefix = (str: string) => {
  if (typeof str !== 'string' || str.match(/^-?0x/u)) {
    return str;
  }

  if (str.match(/^-?0X/u)) {
    return str.replace('0X', '0x');
  }

  if (str.startsWith('-')) {
    return str.replace('-', '-0x');
  }

  return `0x${str}`;
};

function getChainType(chainId: string) {
  if (chainId === CHAIN_IDS.MAINNET) {
    return 'mainnet';
  } else if ((TEST_CHAINS as string[]).includes(chainId)) {
    return 'testnet';
  }
  return 'custom';
}

/**
 * Checks if the alarmname exists in the list
 *
 * @param alarmList
 * @param alarmName
 * @returns
 */
function checkAlarmExists(alarmList: { name: string }[], alarmName: string) {
  return alarmList.some((alarm) => alarm.name === alarmName);
}

export {
  BnMultiplyByFraction,
  addHexPrefix,
  checkAlarmExists,
  getChainType,
  getEnvironmentType,
  getPlatform,
  hexToBn,
};

// Taken from https://stackoverflow.com/a/1349426/3696652
const characters =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
export const generateRandomId = () => {
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < 20; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

export const isValidDate = (d: Date | number) => {
  return d instanceof Date;
};

/**
 * A deferred Promise.
 *
 * A deferred Promise is one that can be resolved or rejected independently of
 * the Promise construction.
 *
 * @typedef {object} DeferredPromise
 * @property {Promise} promise - The Promise that has been deferred.
 * @property {() => void} resolve - A function that resolves the Promise.
 * @property {() => void} reject - A function that rejects the Promise.
 */

type DeferredPromise = {
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  promise: Promise<any>;
  resolve?: () => void;
  reject?: () => void;
};

/**
 * Create a defered Promise.
 *
 * @returns A deferred Promise.
 */
export function deferredPromise(): DeferredPromise {
  let resolve: DeferredPromise['resolve'];
  let reject: DeferredPromise['reject'];
  const promise = new Promise<void>(
    (innerResolve: () => void, innerReject: () => void) => {
      resolve = innerResolve;
      reject = innerReject;
    },
  );
  return { promise, resolve, reject };
}

/**
 * Returns a function with arity 1 that caches the argument that the function
 * is called with and invokes the comparator with both the cached, previous,
 * value and the current value. If specified, the initialValue will be passed
 * in as the previous value on the first invocation of the returned method.
 *
 * @template A - The type of the compared value.
 * @param comparator - A method to compare
 * the previous and next values.
 * @param [initialValue] - The initial value to supply to prevValue
 * on first call of the method.
 */
export function previousValueComparator<A>(
  comparator: (previous: A, next: A) => boolean,
  initialValue: A,
) {
  let first = true;
  let cache: A;
  return (value: A) => {
    try {
      if (first) {
        first = false;
        return comparator(initialValue ?? value, value);
      }
      return comparator(cache, value);
    } finally {
      cache = value;
    }
  };
}

export function addUrlProtocolPrefix(urlString: string) {
  let trimmed = urlString.trim();

  if (trimmed.length && !urlLib.parse(trimmed).protocol) {
    trimmed = `https://${trimmed}`;
  }

  if (getValidUrl(trimmed) !== null) {
    return trimmed;
  }

  return null;
}

export function getValidUrl(urlString: string): URL | null {
  try {
    const url = new URL(urlString);

    if (url.hostname.length === 0 || url.pathname.length === 0) {
      return null;
    }

    if (url.hostname !== decodeURIComponent(url.hostname)) {
      return null; // will happen if there's a %, a space, or other invalid character in the hostname
    }

    return url;
  } catch (error) {
    return null;
  }
}

export function isWebUrl(urlString: string): boolean {
  const url = getValidUrl(urlString);

  return (
    url !== null && (url.protocol === 'https:' || url.protocol === 'http:')
  );
}

/**
 * Determines whether to emit a MetaMetrics event for a given metaMetricsId.
 * Relies on the last 4 characters of the metametricsId. Assumes the IDs are evenly distributed.
 * If metaMetricsIds are distributed evenly, this should be a 1% sample rate
 *
 * @param metaMetricsId - The metametricsId to use for the event.
 * @returns Whether to emit the event or not.
 */
export function shouldEmitDappViewedEvent(metaMetricsId: string): boolean {
  if (metaMetricsId === null) {
    return false;
  }

  const lastFourCharacters = metaMetricsId.slice(-4);
  const lastFourCharactersAsNumber = parseInt(lastFourCharacters, 16);

  return lastFourCharactersAsNumber % 100 === 0;
}

type FormattedTransactionMeta = {
  blockHash: string | null;
  blockNumber: string | null;
  from: string;
  to?: string;
  hash?: string;
  nonce: string;
  input: string;
  v?: string;
  r?: string;
  s?: string;
  value: string;
  gas?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  type: TransactionEnvelopeType;
  accessList: AccessList | null;
  transactionIndex: string | null;
};

export function formatTxMetaForRpcResult(
  txMeta: TransactionMeta,
): FormattedTransactionMeta {
  const { r, s, v, hash, txReceipt, txParams } = txMeta;
  const {
    to,
    data,
    nonce,
    gas,
    from,
    value,
    gasPrice,
    accessList,
    maxFeePerGas,
    maxPriorityFeePerGas,
  } = txParams;

  const formattedTxMeta: FormattedTransactionMeta = {
    v,
    r,
    s,
    to,
    gas,
    from,
    hash,
    nonce: `${nonce}`,
    input: data || '0x',
    value: value || '0x0',
    accessList: accessList || null,
    blockHash: txReceipt?.blockHash || null,
    blockNumber: txReceipt?.blockNumber || null,
    transactionIndex: txReceipt?.transactionIndex || null,
    type:
      maxFeePerGas && maxPriorityFeePerGas
        ? TransactionEnvelopeType.feeMarket
        : TransactionEnvelopeType.legacy,
  };

  if (maxFeePerGas && maxPriorityFeePerGas) {
    formattedTxMeta.gasPrice = maxFeePerGas;
    formattedTxMeta.maxFeePerGas = maxFeePerGas;
    formattedTxMeta.maxPriorityFeePerGas = maxPriorityFeePerGas;
  } else {
    formattedTxMeta.gasPrice = gasPrice;
  }

  return formattedTxMeta;
}

export const isValidAmount = (amount: number | null | undefined): boolean =>
  amount !== null && amount !== undefined && !Number.isNaN(amount);

export function formatValue(
  value: number | null | undefined,
  includeParentheses: boolean,
): string {
  if (!isValidAmount(value)) {
    return '';
  }

  const numericValue = value as number;
  const sign = numericValue >= 0 ? '+' : '';
  const formattedNumber = `${sign}${numericValue.toFixed(2)}%`;

  return includeParentheses ? `(${formattedNumber})` : formattedNumber;
}

type MethodData = {
  name: string;
  params: { type: string }[];
};

export const getMethodDataName = async (
  knownMethodData: Record<string, MethodData>,
  use4ByteResolution: boolean,
  prefixedData: string,
  addKnownMethodData: (fourBytePrefix: string, methodData: MethodData) => void,
  provider: object,
) => {
  if (!prefixedData || !use4ByteResolution) {
    return null;
  }
  const fourBytePrefix = prefixedData.slice(0, 10);

  if (knownMethodData?.[fourBytePrefix]) {
    return knownMethodData?.[fourBytePrefix];
  }

  const methodData = await getMethodDataAsync(
    fourBytePrefix,
    use4ByteResolution,
    provider,
  );

  if (methodData?.name) {
    addKnownMethodData(fourBytePrefix, methodData as MethodData);
  }

  return methodData;
};
