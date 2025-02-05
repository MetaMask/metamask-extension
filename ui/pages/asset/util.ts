import { SUPPORTED_CHAIN_IDS, Token } from '@metamask/assets-controllers';
import { Hex } from '@metamask/utils';

/** Formats a datetime in a short human readable format like 'Feb 8, 12:11 PM' */
export const getShortDateFormatter = () =>
  Intl.DateTimeFormat(navigator.language, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  });

/** Formats a datetime in a short human readable format like 'Feb 8, 2030' */
export const getShortDateFormatterV2 = () =>
  Intl.DateTimeFormat(navigator.language, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

/**
 * Formats a potentially large number to the nearest unit.
 * e.g. 1T for trillions, 2.3B for billions, 4.56M for millions, 7,890 for thousands, etc.
 *
 * @param t - An I18nContext translator.
 * @param number - The number to format.
 * @returns A localized string of the formatted number + unit.
 */
// eslint-disable-next-line
export const localizeLargeNumber = (t: any, number: number) => {
  if (number >= 1000000000000) {
    return `${(number / 1000000000000).toFixed(2)}${t('trillionAbbreviation')}`;
  } else if (number >= 1000000000) {
    return `${(number / 1000000000).toFixed(2)}${t('billionAbbreviation')}`;
  } else if (number >= 1000000) {
    return `${(number / 1000000).toFixed(2)}${t('millionAbbreviation')}`;
  }
  return number.toFixed(2);
};

/**
 * Returns the number of decimals the fiat price should be formatted to.
 * This tells `currency-formatter` to render prices < 1 cent like $0.00001234
 *
 * @param price - The fiat price to determine formatting precision.
 */
export const getPricePrecision = (price: number) => {
  if (price === 0) {
    return 1;
  }
  let precision = 2;
  for (let p = Math.abs(price); p < 1; precision++) {
    p *= 10;
  }
  return precision;
};

/**
 * Returns true if the price api supports the chain id.
 *
 * @param chainId - The hexadecimal chain id.
 */
export const chainSupportsPricing = (chainId: Hex) =>
  (SUPPORTED_CHAIN_IDS as readonly string[]).includes(chainId);

/** The opacity components should set during transition */
export const loadingOpacity = 0.2;

export const findAssetByAddress = (
  data: Record<string, Token[]>,
  address?: string,
  chainId?: string,
): Token | undefined | null => {
  if (!chainId) {
    console.error('Chain ID is required.');
    return null;
  }

  const tokens = data[chainId];

  if (!tokens) {
    console.warn(`No tokens found for chainId: ${chainId}`);
    return null;
  }

  if (!address) {
    return tokens.find((token) => !token.address);
  }

  return tokens.find(
    (token) =>
      token.address && token.address.toLowerCase() === address.toLowerCase(),
  );
};

type ParsedAssetId = {
  namespace: string; // Namespace (e.g., eip155, solana, bip122)
  chainId: string; // Full chain ID (namespace + blockchain ID)
  assetNamespace: string; // Asset namespace (e.g., slip44, erc20, token, ordinal)
  assetReference: string; // Asset reference (on-chain address, token identifier, etc.)
};

const parseAssetId = (assetId: string): ParsedAssetId => {
  // Split the assetId into chain_id and asset details
  const [chainId, assetDetails] = assetId.split('/');

  if (!chainId || !assetDetails) {
    throw new Error(
      'Invalid assetId format. Must include both chainId and asset details.',
    );
  }

  // Split asset details into namespace and reference
  const [assetNamespace, assetReference] = assetDetails.split(':');

  if (!assetNamespace || !assetReference) {
    throw new Error(
      'Invalid asset details format. Must include both assetNamespace and assetReference.',
    );
  }

  // Validate the chainId format (namespace:blockchainId)
  const [namespace, blockchainId] = chainId.split(':');
  if (!namespace || !blockchainId) {
    throw new Error(
      'Invalid chainId format. Must include both namespace and blockchain ID.',
    );
  }

  // Validate assetNamespace (must match [-a-z0-9]{3,8})
  // https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-19.md#syntax
  const assetNamespaceRegex = /^[-a-z0-9]{3,8}$/u;
  if (!assetNamespaceRegex.test(assetNamespace)) {
    throw new Error(
      `Invalid assetNamespace format: "${assetNamespace}". Must be 3-8 characters, containing only lowercase letters, numbers, or dashes.`,
    );
  }

  // Validate assetReference (must match [-.%a-zA-Z0-9]{1,128})
  // https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-19.md#syntax
  const assetReferenceRegex = /^[-.%a-zA-Z0-9]{1,128}$/u;
  if (!assetReferenceRegex.test(assetReference)) {
    throw new Error(
      `Invalid assetReference format: "${assetReference}". Must be 1-128 characters, containing only alphanumerics, dashes, dots, or percent signs.`,
    );
  }

  // Ensure assetReference is URL-decoded if necessary
  // https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-19.md#syntax
  const decodedAssetReference = decodeURIComponent(assetReference);

  return {
    namespace,
    chainId,
    assetNamespace,
    assetReference: decodedAssetReference,
  };
};
