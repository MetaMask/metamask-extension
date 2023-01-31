import punycode from 'punycode/punycode';
import abi from 'human-standard-token-abi';
import BigNumber from 'bignumber.js';
import * as ethUtil from 'ethereumjs-util';
import { DateTime } from 'luxon';
import { getFormattedIpfsUrl } from '@metamask/assets-controllers';
import slip44 from '@metamask/slip44';
import { CHAIN_IDS } from '../../../shared/constants/network';
import {
  toChecksumHexAddress,
  stripHexPrefix,
} from '../../../shared/modules/hexstring-utils';
import {
  TRUNCATED_ADDRESS_START_CHARS,
  TRUNCATED_NAME_CHAR_LIMIT,
  TRUNCATED_ADDRESS_END_CHARS,
} from '../../../shared/constants/labels';
import { Numeric } from '../../../shared/modules/Numeric';

// formatData :: ( date: <Unix Timestamp> ) -> String
export function formatDate(date, format = "M/d/y 'at' T") {
  if (!date) {
    return '';
  }
  return DateTime.fromMillis(date).toFormat(format);
}

export function formatDateWithYearContext(
  date,
  formatThisYear = 'MMM d',
  fallback = 'MMM d, y',
) {
  if (!date) {
    return '';
  }
  const dateTime = DateTime.fromMillis(date);
  const now = DateTime.local();
  return dateTime.toFormat(
    now.year === dateTime.year ? formatThisYear : fallback,
  );
}
/**
 * Determines if the provided chainId is a default MetaMask chain
 *
 * @param {string} chainId - chainId to check
 */
export function isDefaultMetaMaskChain(chainId) {
  if (
    !chainId ||
    chainId === CHAIN_IDS.MAINNET ||
    chainId === CHAIN_IDS.GOERLI ||
    chainId === CHAIN_IDS.SEPOLIA ||
    chainId === CHAIN_IDS.LOCALHOST
  ) {
    return true;
  }

  return false;
}

export function valuesFor(obj) {
  if (!obj) {
    return [];
  }
  return Object.keys(obj).map(function (key) {
    return obj[key];
  });
}

export function addressSummary(
  address,
  firstSegLength = 10,
  lastSegLength = 4,
  includeHex = true,
) {
  if (!address) {
    return '';
  }
  let checked = toChecksumHexAddress(address);
  if (!includeHex) {
    checked = stripHexPrefix(checked);
  }
  return checked
    ? `${checked.slice(0, firstSegLength)}...${checked.slice(
        checked.length - lastSegLength,
      )}`
    : '...';
}

export function isValidDomainName(address) {
  const match = punycode
    .toASCII(address)
    .toLowerCase()
    // Checks that the domain consists of at least one valid domain pieces separated by periods, followed by a tld
    // Each piece of domain name has only the characters a-z, 0-9, and a hyphen (but not at the start or end of chunk)
    // A chunk has minimum length of 1, but minimum tld is set to 2 for now (no 1-character tlds exist yet)
    .match(
      /^(?:[a-z0-9](?:[-a-z0-9]*[a-z0-9])?\.)+[a-z0-9][-a-z0-9]*[a-z0-9]$/u,
    );
  return match !== null;
}

export function isOriginContractAddress(to, sendTokenAddress) {
  if (!to || !sendTokenAddress) {
    return false;
  }
  return to.toLowerCase() === sendTokenAddress.toLowerCase();
}

// Takes wei Hex, returns wei BN, even if input is null
export function numericBalance(balance) {
  if (!balance) {
    return new ethUtil.BN(0, 16);
  }
  const stripped = stripHexPrefix(balance);
  return new ethUtil.BN(stripped, 16);
}

// Takes  hex, returns [beforeDecimal, afterDecimal]
export function parseBalance(balance) {
  let afterDecimal;
  const wei = numericBalance(balance);
  const weiString = wei.toString();
  const trailingZeros = /0+$/u;

  const beforeDecimal =
    weiString.length > 18 ? weiString.slice(0, weiString.length - 18) : '0';
  afterDecimal = `000000000000000000${wei}`
    .slice(-18)
    .replace(trailingZeros, '');
  if (afterDecimal === '') {
    afterDecimal = '0';
  }
  return [beforeDecimal, afterDecimal];
}

// Takes wei hex, returns an object with three properties.
// Its "formatted" property is what we generally use to render values.
export function formatBalance(
  balance,
  decimalsToKeep,
  needsParse = true,
  ticker = 'ETH',
) {
  const parsed = needsParse ? parseBalance(balance) : balance.split('.');
  const beforeDecimal = parsed[0];
  let afterDecimal = parsed[1];
  let formatted = 'None';
  if (decimalsToKeep === undefined) {
    if (beforeDecimal === '0') {
      if (afterDecimal !== '0') {
        const sigFigs = afterDecimal.match(/^0*(.{2})/u); // default: grabs 2 most significant digits
        if (sigFigs) {
          afterDecimal = sigFigs[0];
        }
        formatted = `0.${afterDecimal} ${ticker}`;
      }
    } else {
      formatted = `${beforeDecimal}.${afterDecimal.slice(0, 3)} ${ticker}`;
    }
  } else {
    afterDecimal += Array(decimalsToKeep).join('0');
    formatted = `${beforeDecimal}.${afterDecimal.slice(
      0,
      decimalsToKeep,
    )} ${ticker}`;
  }
  return formatted;
}

export function getContractAtAddress(tokenAddress) {
  return global.eth.contract(abi).at(tokenAddress);
}

export function getRandomFileName() {
  let fileName = '';
  const charBank = [
    ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  ];
  const fileNameLength = Math.floor(Math.random() * 7 + 6);

  for (let i = 0; i < fileNameLength; i++) {
    fileName += charBank[Math.floor(Math.random() * charBank.length)];
  }

  return fileName;
}

/**
 * Shortens an Ethereum address for display, preserving the beginning and end.
 * Returns the given address if it is no longer than 10 characters.
 * Shortened addresses are 13 characters long.
 *
 * Example output: 0xabcd...1234
 *
 * @param {string} address - The address to shorten.
 * @returns {string} The shortened address, or the original if it was no longer
 * than 10 characters.
 */
export function shortenAddress(address = '') {
  if (address.length < TRUNCATED_NAME_CHAR_LIMIT) {
    return address;
  }

  return `${address.slice(0, TRUNCATED_ADDRESS_START_CHARS)}...${address.slice(
    -TRUNCATED_ADDRESS_END_CHARS,
  )}`;
}

export function getAccountByAddress(accounts = [], targetAddress) {
  return accounts.find(({ address }) => address === targetAddress);
}

/**
 * Strips the following schemes from URL strings:
 * - http
 * - https
 *
 * @param {string} urlString - The URL string to strip the scheme from.
 * @returns {string} The URL string, without the scheme, if it was stripped.
 */
export function stripHttpSchemes(urlString) {
  return urlString.replace(/^https?:\/\//u, '');
}

/**
 * Strips the following schemes from URL strings:
 * - https
 *
 * @param {string} urlString - The URL string to strip the scheme from.
 * @returns {string} The URL string, without the scheme, if it was stripped.
 */
export function stripHttpsScheme(urlString) {
  return urlString.replace(/^https:\/\//u, '');
}

/**
 * Strips `https` schemes from URL strings, if the URL does not have a port.
 * This is useful
 *
 * @param {string} urlString - The URL string to strip the scheme from.
 * @returns {string} The URL string, without the scheme, if it was stripped.
 */
export function stripHttpsSchemeWithoutPort(urlString) {
  if (getURL(urlString).port) {
    return urlString;
  }

  return stripHttpsScheme(urlString);
}

/**
 * Checks whether a URL-like value (object or string) is an extension URL.
 *
 * @param {string | URL | object} urlLike - The URL-like value to test.
 * @returns {boolean} Whether the URL-like value is an extension URL.
 */
export function isExtensionUrl(urlLike) {
  const EXT_PROTOCOLS = ['chrome-extension:', 'moz-extension:'];

  if (typeof urlLike === 'string') {
    for (const protocol of EXT_PROTOCOLS) {
      if (urlLike.startsWith(protocol)) {
        return true;
      }
    }
  }

  if (urlLike?.protocol) {
    return EXT_PROTOCOLS.includes(urlLike.protocol);
  }
  return false;
}

/**
 * Checks whether an address is in a passed list of objects with address properties. The check is performed on the
 * lowercased version of the addresses.
 *
 * @param {string} address - The hex address to check
 * @param {Array} list - The array of objects to check
 * @returns {boolean} Whether or not the address is in the list
 */
export function checkExistingAddresses(address, list = []) {
  if (!address) {
    return false;
  }

  const matchesAddress = (obj) => {
    return obj.address.toLowerCase() === address.toLowerCase();
  };

  return list.some(matchesAddress);
}

export function bnGreaterThan(a, b) {
  if (a === null || a === undefined || b === null || b === undefined) {
    return null;
  }
  return new BigNumber(a, 10).gt(b, 10);
}

export function bnLessThan(a, b) {
  if (a === null || a === undefined || b === null || b === undefined) {
    return null;
  }
  return new BigNumber(a, 10).lt(b, 10);
}

export function bnGreaterThanEqualTo(a, b) {
  if (a === null || a === undefined || b === null || b === undefined) {
    return null;
  }
  return new BigNumber(a, 10).gte(b, 10);
}

export function bnLessThanEqualTo(a, b) {
  if (a === null || a === undefined || b === null || b === undefined) {
    return null;
  }
  return new BigNumber(a, 10).lte(b, 10);
}

export function getURL(url) {
  try {
    return new URL(url);
  } catch (err) {
    return '';
  }
}

export function getURLHost(url) {
  return getURL(url)?.host || '';
}

export function getURLHostName(url) {
  return getURL(url)?.hostname || '';
}

// Once we reach this threshold, we switch to higher unit
const MINUTE_CUTOFF = 90 * 60;
const SECOND_CUTOFF = 90;

export const toHumanReadableTime = (t, milliseconds) => {
  if (milliseconds === undefined || milliseconds === null) {
    return '';
  }
  const seconds = Math.ceil(milliseconds / 1000);
  if (seconds <= SECOND_CUTOFF) {
    return t('gasTimingSecondsShort', [seconds]);
  }
  if (seconds <= MINUTE_CUTOFF) {
    return t('gasTimingMinutesShort', [Math.ceil(seconds / 60)]);
  }
  return t('gasTimingHoursShort', [Math.ceil(seconds / 3600)]);
};

export function clearClipboard() {
  window.navigator.clipboard.writeText('');
}

const solidityTypes = () => {
  const types = [
    'bool',
    'address',
    'string',
    'bytes',
    'int',
    'uint',
    'fixed',
    'ufixed',
  ];

  const ints = Array.from(new Array(32)).map(
    (_, index) => `int${(index + 1) * 8}`,
  );
  const uints = Array.from(new Array(32)).map(
    (_, index) => `uint${(index + 1) * 8}`,
  );
  const bytes = Array.from(new Array(32)).map(
    (_, index) => `bytes${index + 1}`,
  );

  /**
   * fixed and ufixed
   * This value type also can be declared keywords such as ufixedMxN and fixedMxN.
   * The M represents the amount of bits that the type takes,
   * with N representing the number of decimal points that are available.
   *  M has to be divisible by 8, and a number from 8 to 256.
   * N has to be a value between 0 and 80, also being inclusive.
   */
  const fixedM = Array.from(new Array(32)).map(
    (_, index) => `fixed${(index + 1) * 8}`,
  );
  const ufixedM = Array.from(new Array(32)).map(
    (_, index) => `ufixed${(index + 1) * 8}`,
  );
  const fixed = Array.from(new Array(80)).map((_, index) =>
    fixedM.map((aFixedM) => `${aFixedM}x${index + 1}`),
  );
  const ufixed = Array.from(new Array(80)).map((_, index) =>
    ufixedM.map((auFixedM) => `${auFixedM}x${index + 1}`),
  );

  return [
    ...types,
    ...ints,
    ...uints,
    ...bytes,
    ...fixed.flat(),
    ...ufixed.flat(),
  ];
};

const SOLIDITY_TYPES = solidityTypes();

const stripArrayType = (potentialArrayType) =>
  potentialArrayType.replace(/\[[[0-9]*\]*/gu, '');

const stripOneLayerofNesting = (potentialArrayType) =>
  potentialArrayType.replace(/\[[[0-9]*\]/u, '');

const isArrayType = (potentialArrayType) =>
  potentialArrayType.match(/\[[[0-9]*\]*/u) !== null;

const isSolidityType = (type) => SOLIDITY_TYPES.includes(type);

export const sanitizeMessage = (msg, primaryType, types) => {
  if (!types) {
    throw new Error(`Invalid types definition`);
  }

  // Primary type can be an array.
  const isArray = primaryType && isArrayType(primaryType);
  if (isArray) {
    return msg.map((value) =>
      sanitizeMessage(value, stripOneLayerofNesting(primaryType), types),
    );
  } else if (isSolidityType(primaryType)) {
    return msg;
  }

  // If not, assume to be struct
  const baseType = isArray ? stripArrayType(primaryType) : primaryType;

  const baseTypeDefinitions = types[baseType];
  if (!baseTypeDefinitions) {
    throw new Error(`Invalid primary type definition`);
  }

  const sanitizedMessage = {};
  const msgKeys = Object.keys(msg);
  msgKeys.forEach((msgKey) => {
    const definedType = Object.values(baseTypeDefinitions).find(
      (baseTypeDefinition) => baseTypeDefinition.name === msgKey,
    );

    if (!definedType) {
      return;
    }

    sanitizedMessage[msgKey] = sanitizeMessage(
      msg[msgKey],
      definedType.type,
      types,
    );
  });
  return sanitizedMessage;
};

export function getAssetImageURL(image, ipfsGateway) {
  if (!image || !ipfsGateway || typeof image !== 'string') {
    return '';
  }

  if (image.startsWith('ipfs://')) {
    return getFormattedIpfsUrl(ipfsGateway, image, true);
  }
  return image;
}

export function roundToDecimalPlacesRemovingExtraZeroes(
  numberish,
  numberOfDecimalPlaces,
) {
  if (numberish === undefined || numberish === null) {
    return '';
  }
  return new Numeric(
    new Numeric(numberish, 10).toFixed(numberOfDecimalPlaces),
    10,
  ).toNumber();
}

/**
 * Gets the name of the SLIP-44 protocol corresponding to the specified
 * `coin_type`.
 *
 * @param {string | number} coinType - The SLIP-44 `coin_type` value whose name
 * to retrieve.
 * @returns {string | undefined} The name of the protocol if found.
 */
export function coinTypeToProtocolName(coinType) {
  if (String(coinType) === '1') {
    return 'Test Networks';
  }
  return slip44[coinType]?.name || undefined;
}

/**
 * Tests "nullishness". Used to guard a section of a component from being
 * rendered based on a value.
 *
 * @param {any} value - A value (literally anything).
 * @returns `true` if the value is null or undefined, `false` otherwise.
 */
export function isNullish(value) {
  return value === null || value === undefined;
}
