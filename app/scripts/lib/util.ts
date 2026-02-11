import urlLib from 'url';
import ipRegex from 'ip-regex';
import { AccessList } from '@ethereumjs/tx';
import BN from 'bn.js';
import { memoize } from 'lodash';
import {
  TransactionEnvelopeType,
  TransactionMeta,
} from '@metamask/transaction-controller';
import type { Provider } from '@metamask/network-controller';
import { CaipAssetType, parseCaipAssetType } from '@metamask/utils';
import { MultichainAssetsRatesControllerState } from '@metamask/assets-controllers';
import { AssetConversion, FungibleAssetMarketData } from '@metamask/snaps-sdk';
import {
  ENVIRONMENT_TYPE_BACKGROUND,
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_NOTIFICATION,
  ENVIRONMENT_TYPE_SIDEPANEL,
  ENVIRONMENT_TYPE_POPUP,
  PLATFORM_BRAVE,
  PLATFORM_CHROME,
  PLATFORM_CHROMIUM,
  PLATFORM_COCCOC,
  PLATFORM_EDGE,
  PLATFORM_EDGE_ANDROID,
  PLATFORM_FIREFOX,
  PLATFORM_KIWI,
  PLATFORM_LEMUR,
  PLATFORM_MAXTHON,
  PLATFORM_MISES,
  PLATFORM_OPERA,
  PLATFORM_OTHER,
  PLATFORM_PUFFIN,
  PLATFORM_QQBROWSER,
  PLATFORM_SAMSUNG,
  PLATFORM_SILK,
  PLATFORM_UCBROWSER,
  PLATFORM_VIVALDI,
  PLATFORM_WHALE,
  PLATFORM_YANDEX,
  type Platform,
} from '../../../shared/constants/app';
import { CHAIN_IDS, TEST_CHAINS } from '../../../shared/constants/network';
import { stripHexPrefix } from '../../../shared/modules/hexstring-utils';
import { getMethodDataAsync } from '../../../shared/lib/four-byte';
import {
  getSafeChainsListFromCacheOnly,
  getIsMetaMaskInfuraEndpointUrl,
  getIsQuicknodeEndpointUrl,
  KNOWN_CUSTOM_ENDPOINT_URLS,
} from '../../../shared/lib/network-utils';
// Re-export install type utilities from dedicated module to avoid circular dependencies
// and keep the sentry bundle lightweight
export { getInstallType, initInstallType } from './install-type';

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
  } else if (parsedUrl.pathname === '/sidepanel.html') {
    return ENVIRONMENT_TYPE_SIDEPANEL;
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

// Brand to platform mapping for userAgentData.brands detection
// Used as fallback when UA string detection returns Chrome or Other
const BRAND_TO_PLATFORM_MAP: Record<string, Platform> = {
  Brave: PLATFORM_BRAVE,
  'Google Chrome': PLATFORM_CHROME,
  Lemur: PLATFORM_LEMUR,
  'Microsoft Edge': PLATFORM_EDGE,
  Mises: PLATFORM_MISES,
  Opera: PLATFORM_OPERA,
  'Samsung Internet': PLATFORM_SAMSUNG,
  Vivaldi: PLATFORM_VIVALDI,
  Whale: PLATFORM_WHALE,
  YaBrowser: PLATFORM_YANDEX,
  Yandex: PLATFORM_YANDEX,
};

/**
 * Detects platform from userAgentData.brands.
 * Filters out noise brands (Chromium, GREASE brands) and matches against known browsers.
 * Returns unknown meaningful brands for analytics discovery.
 *
 * @returns the matched Platform, unknown brand name, or undefined if not detected
 */
const getPlatformFromBrands = (): Platform | undefined => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { userAgentData } = window.navigator as any;
  if (!userAgentData?.brands) {
    return undefined;
  }

  // Extract brand names
  const brands: string[] = userAgentData.brands.map(
    (b: { brand: string }) => b.brand,
  );

  // Filter out noise brands (Chromium engine and GREASE brands like "Not(A:Brand")
  const meaningfulBrands = brands.filter((brand) => {
    const lowerBrand = brand.toLowerCase();
    return !lowerBrand.includes('chromium') && !lowerBrand.includes('brand');
  });

  // Check each meaningful brand against our mapping
  for (const brand of meaningfulBrands) {
    const platform = BRAND_TO_PLATFORM_MAP[brand];
    if (platform) {
      return platform;
    }
  }

  // Return first unknown meaningful brand for analytics discovery
  // This allows us to detect new browsers we haven't explicitly mapped yet
  if (meaningfulBrands.length > 0) {
    return meaningfulBrands[0] as Platform;
  }

  return undefined;
};

/**
 * Detects platform from the User-Agent string.
 *
 * @returns the detected Platform
 */
const getPlatformFromUserAgent = (): Platform => {
  const { navigator } = window;
  const { userAgent } = navigator;

  // Firefox - check first as it has a unique engine
  if (userAgent.includes('Firefox')) {
    return PLATFORM_FIREFOX;
  }

  // Brave - uses navigator.brave API
  if ('brave' in navigator) {
    return PLATFORM_BRAVE;
  }

  // Edge - identified by "Edg/" in user agent (desktop) or "EdgA/" (Android)
  if (userAgent.includes('EdgA/')) {
    return PLATFORM_EDGE_ANDROID;
  }
  if (userAgent.includes('Edg/')) {
    return PLATFORM_EDGE;
  }

  // Opera - identified by "OPR" in user agent
  if (userAgent.includes('OPR')) {
    return PLATFORM_OPERA;
  }

  // Chromium-based browsers with unique identifiers
  // Check these before Chrome since they include "Chrome/" in their user agent
  if (userAgent.includes('Vivaldi/')) {
    return PLATFORM_VIVALDI;
  }
  if (userAgent.includes('YaBrowser/')) {
    return PLATFORM_YANDEX;
  }
  if (userAgent.includes('SamsungBrowser/')) {
    return PLATFORM_SAMSUNG;
  }
  if (userAgent.includes('Whale/')) {
    return PLATFORM_WHALE;
  }
  if (userAgent.includes('Puffin/')) {
    return PLATFORM_PUFFIN;
  }
  if (userAgent.includes('Silk/')) {
    return PLATFORM_SILK;
  }
  if (userAgent.includes('UCBrowser/')) {
    return PLATFORM_UCBROWSER;
  }
  if (userAgent.includes('Maxthon/')) {
    return PLATFORM_MAXTHON;
  }
  if (userAgent.includes('coc_coc_browser/')) {
    return PLATFORM_COCCOC;
  }
  if (userAgent.includes('QQBrowser/') || userAgent.includes('MQQBrowser/')) {
    return PLATFORM_QQBROWSER;
  }
  if (userAgent.includes('Kiwi')) {
    return PLATFORM_KIWI;
  }
  if (userAgent.includes('Lemur')) {
    return PLATFORM_LEMUR;
  }
  if (userAgent.includes('Mises')) {
    return PLATFORM_MISES;
  }
  if (userAgent.includes('Chromium/')) {
    return PLATFORM_CHROMIUM;
  }

  // Chrome - identified by "Chrome/" and "Safari/" in user agent
  // Note: Some browsers like Arc mimic Chrome's exact user agent and cannot be distinguished
  if (userAgent.includes('Chrome/') && userAgent.includes('Safari/')) {
    return PLATFORM_CHROME;
  }

  // Unknown browser
  return PLATFORM_OTHER;
};

/**
 * Returns the platform (browser) where the extension is running.
 * Uses a hybrid approach: first tries UA string detection, then falls back to
 * userAgentData.brands for browsers that hide their identity in the UA string
 * but expose it via the Client Hints API (e.g., Lemur, Mises).
 *
 * @returns the platform ENUM
 */
const getPlatform = (): Platform => {
  // First, try to detect from User-Agent string
  const platformFromUA = getPlatformFromUserAgent();

  // If UA detection found a specific browser, use it
  if (platformFromUA !== PLATFORM_CHROME && platformFromUA !== PLATFORM_OTHER) {
    return platformFromUA;
  }

  // UA returned Chrome or Other - try userAgentData.brands as fallback
  // Some browsers (Lemur, Mises) hide their identity in UA but expose it in brands
  const platformFromBrands = getPlatformFromBrands();
  if (platformFromBrands) {
    return platformFromBrands;
  }

  // Return what UA detection found (Chrome or Other)
  return platformFromUA;
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
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
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
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
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

export function isValidEmail(email: string): boolean {
  return email.match(/^([\w.%+-]+)@([\w-]+\.)+([\w]{2,})$/iu) !== null;
}

export function isWebUrl(urlString: string): boolean {
  const url = getValidUrl(urlString);

  return (
    url !== null && (url.protocol === 'https:' || url.protocol === 'http:')
  );
}

/**
 * Checks if an origin string is a web origin (http:// or https://).
 * This is used to filter out non-web origins like chrome://, about://, moz-extension://, etc.
 *
 * @param origin - The origin string to check (e.g., "https://example.com", "chrome://newtab")
 * @returns true if the origin starts with http:// or https://, false otherwise
 */
export function isWebOrigin(origin: string | undefined | null): boolean {
  if (!origin) {
    return false;
  }
  return origin.startsWith('http://') || origin.startsWith('https://');
}

/**
 * Determines whether to emit a MetaMetrics event for a given metaMetricsId.
 * Relies on the last 4 characters of the metametricsId. Assumes the IDs are evenly distributed.
 * If metaMetricsIds are distributed evenly, this should be a 1% sample rate
 *
 * @param metaMetricsId - The metametricsId to use for the event.
 * @returns Whether to emit the event or not.
 */
export function shouldEmitDappViewedEvent(
  metaMetricsId: string | null,
): boolean {
  const isFireFox = getPlatform() === PLATFORM_FIREFOX;

  if (metaMetricsId === null || isFireFox) {
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
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    input: data || '0x',
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    value: value || '0x0',
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    accessList: accessList || null,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    blockHash: txReceipt?.blockHash || null,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    blockNumber: txReceipt?.blockNumber || null,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
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
  provider: Provider,
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

/**
 * Get a boolean value for a string or boolean value.
 *
 * @param value - The value to convert to a boolean.
 * @returns `true` if the value is `'true'` or `true`, otherwise `false`.
 * @example
 * getBooleanFlag('true'); // true
 * getBooleanFlag(true); // true
 * getBooleanFlag('false'); // false
 * getBooleanFlag(false); // false
 */
export function getBooleanFlag(value: string | boolean | undefined): boolean {
  return value === true || value === 'true';
}

type AssetsRatesState = {
  metamask: MultichainAssetsRatesControllerState;
};

export function getConversionRatesForNativeAsset({
  conversionRates,
  chainId,
}: {
  conversionRates: AssetsRatesState['metamask']['conversionRates'];
  chainId: string;
}): (AssetConversion & { marketData?: FungibleAssetMarketData }) | null {
  // Return early if conversionRates is falsy
  if (!conversionRates) {
    return null;
  }

  let conversionRateResult = null;

  Object.entries(conversionRates).forEach(
    ([caip19Identifier, conversionRate]) => {
      const { assetNamespace, chainId: caipChainId } = parseCaipAssetType(
        caip19Identifier as CaipAssetType,
      );
      if (assetNamespace === 'slip44' && caipChainId === chainId) {
        conversionRateResult = conversionRate;
      }
    },
  );

  return conversionRateResult;
}

// Cache for known domains
let knownDomainsSet: Set<string> | null = null;
let initPromise: Promise<void> | null = null;

/**
 * Extracts the hostname from a URL.
 *
 * @param url - The URL to extract the hostname from.
 * @returns The lowercase hostname, or null if the URL is invalid.
 */
function extractHostname(url: string): string | null {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Check if a hostname is localhost or an IP address.
 * Public RPC providers use domain names, not raw IP addresses.
 * These should never be considered "public" endpoints even if they appear in chainlist.
 *
 * @param hostname - The hostname to check.
 * @returns True if the hostname is localhost or an IP address (v4 or v6).
 */
function isLocalhostOrIPAddress(hostname: string): boolean {
  const lowerHostname = hostname.toLowerCase();

  // Check for localhost
  if (lowerHostname === 'localhost') {
    return true;
  }

  // Remove brackets from IPv6 addresses for testing (e.g., [::1] -> ::1)
  const hostnameWithoutBrackets = lowerHostname.replace(/^\[|\]$/gu, '');

  // Check for IP address (v4 or v6)
  if (ipRegex({ exact: true }).test(hostnameWithoutBrackets)) {
    return true;
  }

  return false;
}

// RFC 6761 special-use TLDs that should never be used by real public RPC providers
const SPECIAL_USE_TLDS = [
  '.test',
  '.localhost',
  '.invalid',
  '.example',
  '.local',
] as const;

// RFC 6761 reserved example domains
const RESERVED_EXAMPLE_DOMAINS = ['example.com', 'example.net', 'example.org'];

/**
 * Check if a hostname is a special-use domain per RFC 6761.
 * These domains are reserved and should never be used by real public RPC providers.
 *
 * @param hostname - The hostname to check.
 * @returns True if the hostname is a special-use domain.
 * @see https://datatracker.ietf.org/doc/html/rfc6761
 */
export function isSpecialUseDomain(hostname: string): boolean {
  const lowerHostname = hostname.toLowerCase();

  // Check special-use TLDs
  if (SPECIAL_USE_TLDS.some((tld) => lowerHostname.endsWith(tld))) {
    return true;
  }

  // Check reserved example domains (exact match or subdomain)
  if (
    RESERVED_EXAMPLE_DOMAINS.some(
      (domain) =>
        lowerHostname === domain || lowerHostname.endsWith(`.${domain}`),
    )
  ) {
    return true;
  }

  return false;
}

/**
 * Initialize the set of known domains from the safe chainlist cache.
 * This should be called once at startup in the background context.
 * Localhost and private IP addresses are filtered out to prevent leaking
 * private network information to analytics.
 *
 * @returns A promise that resolves when initialization is complete.
 */
export async function initializeRpcProviderDomains(): Promise<void> {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      const chainsList = await getSafeChainsListFromCacheOnly();
      knownDomainsSet = new Set<string>();

      for (const chain of chainsList) {
        if (chain.rpc && Array.isArray(chain.rpc)) {
          for (const rpcUrl of chain.rpc) {
            const hostname = extractHostname(rpcUrl);
            // Filter out localhost, IP addresses, and RFC 6761 special-use domains
            // Public providers use real domain names
            if (
              hostname &&
              !isLocalhostOrIPAddress(hostname) &&
              !isSpecialUseDomain(hostname)
            ) {
              knownDomainsSet.add(hostname);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error initializing known domains:', error);
      knownDomainsSet = new Set<string>();
    }
  })();

  return initPromise;
}

/**
 * Check if a domain is in the known domains list
 *
 * @param domain - The domain to check.
 * @returns True if the domain is found in the chainlist cache.
 */
export function isKnownDomain(domain: string): boolean {
  return knownDomainsSet?.has(domain?.toLowerCase()) ?? false;
}

/**
 * Check if an RPC endpoint URL has a "known" domain, i.e. the domain is listed
 * in a public registry. Localhost and private IPs are filtered out during
 * initialization of the known domains set.
 *
 * @param endpointUrl - The URL of the RPC endpoint.
 * @returns True if the endpoint's domain is listed in a public registry.
 */
function isKnownEndpointUrl(endpointUrl: string): boolean {
  const hostname = extractHostname(endpointUrl);
  if (!hostname) {
    return false;
  }
  return isKnownDomain(hostname);
}

/**
 * Some URLs that users add as networks refer to private servers, and we do not
 * want to report these in Segment (or any other data collection service). This
 * function returns whether the given RPC endpoint is safe to share.
 *
 * @param endpointUrl - The URL of the endpoint.
 * @param infuraProjectId - Our Infura project ID.
 * @returns True if the endpoint URL is safe to share with external data
 * collection services, false otherwise.
 */
export function isPublicEndpointUrl(
  endpointUrl: string,
  infuraProjectId: string,
): boolean {
  const isMetaMaskInfuraEndpointUrl = getIsMetaMaskInfuraEndpointUrl(
    endpointUrl,
    infuraProjectId,
  );
  const isQuicknodeEndpointUrl = getIsQuicknodeEndpointUrl(endpointUrl);
  const isKnownCustomEndpointUrl =
    KNOWN_CUSTOM_ENDPOINT_URLS.includes(endpointUrl);
  const isKnownEndpoint = isKnownEndpointUrl(endpointUrl);

  return (
    isMetaMaskInfuraEndpointUrl ||
    isQuicknodeEndpointUrl ||
    isKnownCustomEndpointUrl ||
    isKnownEndpoint
  );
}

/**
 * Extracts the domain from an RPC endpoint URL with privacy considerations
 *
 * @param rpcUrl - The RPC endpoint URL
 * @param knownDomainsForTesting - Optional Set of known domains for testing purposes
 * @returns The domain for known providers, 'private' for private/custom networks, or 'invalid' for invalid URLs
 */
export function extractRpcDomain(
  rpcUrl: string,
  knownDomainsForTesting?: Set<string>,
): string {
  if (!rpcUrl) {
    return 'invalid';
  }

  try {
    // Try to parse the URL directly
    let url;
    try {
      url = new URL(rpcUrl);
    } catch (e) {
      // If parsing fails, check if it looks like a domain without protocol
      if (rpcUrl.includes('://')) {
        return 'invalid';
      }

      // Try adding https:// prefix for domain-like strings
      try {
        url = new URL(`https://${rpcUrl}`);
      } catch (e2) {
        return 'invalid';
      }
    }

    // Use the provided test domains if available, otherwise use isKnownDomain
    if (knownDomainsForTesting) {
      if (knownDomainsForTesting.has(url.hostname.toLowerCase())) {
        return url.hostname.toLowerCase();
      }
    } else if (isKnownDomain(url.hostname)) {
      return url.hostname.toLowerCase();
    }

    return 'private';
  } catch (error) {
    return 'invalid';
  }
}
