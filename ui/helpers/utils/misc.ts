import * as lodash from 'lodash';
import { isObject } from '@metamask/utils';

/**
 * Returns the values of an object
 *
 * @param obj - Object to get values from
 * @returns Array of values
 */
export function valuesFor<T>(obj?: Record<string, T>): T[] {
  if (!obj) {
    return [];
  }
  return Object.keys(obj).map(function (key) {
    return obj[key];
  });
}

/**
 * Clears the clipboard
 */
export function clearClipboard(): void {
  window.navigator.clipboard.writeText('');
}

/**
 * Generate Solidity types including arrays and fixed types
 *
 * @returns Array of Solidity types
 */
const solidityTypes = (): string[] => {
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

/**
 * Cached list of Solidity types
 */
const SOLIDITY_TYPES = solidityTypes();

/**
 * Strips array type notation from a type string
 *
 * @param potentialArrayType - Type string that might be an array type
 * @returns Type string without array notation
 */
const stripArrayType = (potentialArrayType: string): string =>
  potentialArrayType.replace(/\[[[0-9]*\]*/gu, '');

/**
 * Strips one layer of nesting from an array type
 *
 * @param potentialArrayType - Type string that might be an array type
 * @returns Type string with one less layer of nesting
 */
export const stripOneLayerofNesting = (potentialArrayType: string): string =>
  potentialArrayType.replace(/\[(\d*)\]/u, '');

/**
 * Checks if a type is an array type
 *
 * @param potentialArrayType - Type string to check
 * @returns Whether the type is an array type
 */
const isArrayType = (potentialArrayType: string): boolean =>
  potentialArrayType.match(/\[[[0-9]*\]*/u) !== null;

/**
 * Checks if a type is a Solidity type
 *
 * @param type - Type string to check
 * @returns Whether the type is a Solidity type
 */
const isSolidityType = (type: string): boolean => SOLIDITY_TYPES.includes(type);

/**
 * Sanitizes an EIP-712 message for display
 *
 * @param msg - The message to sanitize
 * @param primaryType - The primary type of the message
 * @param types - The types definition
 * @returns The sanitized message
 */
export const sanitizeMessage = (
  msg: Record<string, any>,
  primaryType: string,
  types: Record<string, { name: string; type: string }[]>,
): { value: any; type: string } => {
  if (!types) {
    throw new Error(`Invalid types definition`);
  }

  // Primary type can be an array.
  const isArray = primaryType && isArrayType(primaryType);
  if (isArray) {
    return {
      value: msg.map((value: any) =>
        sanitizeMessage(value, stripOneLayerofNesting(primaryType), types),
      ),
      type: primaryType,
    };
  } else if (isSolidityType(primaryType)) {
    return { value: msg, type: primaryType };
  }

  // If not, assume to be struct
  const baseType = isArray ? stripArrayType(primaryType) : primaryType;

  const baseTypeDefinitions = types[baseType];
  if (!baseTypeDefinitions) {
    throw new Error(`Invalid primary type definition`);
  }

  const sanitizedStruct: Record<string, any> = {};
  const msgKeys = Object.keys(msg);
  msgKeys.forEach((msgKey) => {
    const definedType = Object.values(baseTypeDefinitions).find(
      (baseTypeDefinition) => baseTypeDefinition.name === msgKey,
    );

    if (!definedType) {
      return;
    }

    sanitizedStruct[msgKey] = sanitizeMessage(
      msg[msgKey],
      definedType.type,
      types,
    );
  });
  return { value: sanitizedStruct, type: primaryType };
};

/**
 * Tests "nullishness". Used to guard a section of a component from being
 * rendered based on a value.
 *
 * @param value - A value (literally anything)
 * @returns `true` if the value is null or undefined, `false` otherwise
 */
export function isNullish(value: any): boolean {
  return value === null || value === undefined;
}

/**
 * Sort the given list of account their selecting order (descending)
 *
 * @param accounts - The internal accounts list
 * @returns The sorted internal account list
 */
export function sortSelectedInternalAccounts<
  T extends { metadata: { lastSelected?: number } },
>(accounts: T[]): T[] {
  return accounts.sort((accountA, accountB) => {
    // Sort by `.lastSelected` in descending order
    return (
      (accountB.metadata.lastSelected ?? 0) -
      (accountA.metadata.lastSelected ?? 0)
    );
  });
}

/**
 * The method escape RTL character in string
 *
 * @param value - Value to sanitize
 * @returns Escaped string or original param value
 */
export const sanitizeString = (value: any): any => {
  if (!value) {
    return value;
  }
  if (!lodash.isString(value)) {
    return value;
  }
  const regex = /\u202E/giu;
  return value.replace(regex, '\\u202E');
};
