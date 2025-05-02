/* eslint-disable no-plusplus */
import {
  bytesToHex,
  isHexString,
  isStrictHexString,
  isValidChecksumAddress,
  isValidHexAddress,
  numberToHex,
  remove0x,
  stringToBytes,
  type Hex,
} from '@metamask/utils';
import { keccak } from 'ethereumjs-util';

type Address = Hex;

export type { Address, Hex };

function stringToHex(value: string): Hex {
  return bytesToHex(stringToBytes(value));
}

function boolToHex(value: boolean): Hex {
  return `0x${Number(value)}`;
}

type ToHexOptions = {
  /**
   * The size of the hex string. Defaults to `undefined`.
   */
  size?: number | undefined;
};

/**
 * Converts a value to a hex string.
 *
 * @param value - The value to convert
 * @param options - Options for the function
 * @param options.size - The size of the hex string. Defaults to `undefined`
 * @returns The hex string
 */
export function toHex(
  value: string | number | boolean | Buffer | Uint8Array,
  options?: ToHexOptions | undefined,
): Hex {
  const { size } = options || {};
  const res: Hex = (() => {
    if (value instanceof Uint8Array) {
      return bytesToHex(value);
    }
    if (Buffer.isBuffer(value)) {
      return `0x${value.toString('hex')}`;
    }
    if (typeof value === 'number' || typeof value === 'bigint') {
      return numberToHex(value);
    }
    if (typeof value === 'string') {
      return stringToHex(value);
    }
    if (typeof value === 'boolean') {
      return boolToHex(value);
    }
    return bytesToHex(value);
  })();
  if (size) {
    return pad(res, { size });
  }
  return res;
}

type IsHexOptions = {
  /**
   * Enables strict mode. Whether or not to check if the value is a valid hex string.
   *
   * @default true
   */
  strict?: boolean | undefined;
};

/**
 * Checks if the given value is a valid hex string.
 *
 * @param value - The value to check
 * @param options - Options for the function
 * @param options.strict - Enables strict mode. Whether or not to check if the value is a valid hex string. Defaults to `true`
 * @returns `true` if the value is a valid hex string, `false` otherwise
 */
export function isHex(
  value: unknown,
  options?: IsHexOptions | undefined,
): value is Hex {
  const { strict = true } = options || {};
  return strict ? isStrictHexString(value) : isHexString(value);
}

/**
 * Checks if two hex strings are equal.
 *
 * @param a - The first hex string.
 * @param b - The second hex string.
 * @returns True if the hex strings are equal, false otherwise.
 */
export function isHexEqual(a: Hex, b: Hex) {
  return a.toLowerCase() === b.toLowerCase();
}

type PadOptions = {
  dir?: 'left' | 'right' | undefined;
  size?: number | null | undefined;
};

/**
 * Pads a hex string with zeros on the left or right.
 *
 * @param value - The hex string to pad
 * @param options - Options for the function
 * @param options.dir - The direction to pad the hex string. Defaults to `'left'`
 * @param options.size - The size of the hex string. Defaults to `32`
 * @returns The padded hex string
 */
export function pad(value: Hex, options?: PadOptions | undefined): Hex {
  const { dir = 'left', size = 32 } = options || {};

  if (size === null) {
    return value;
  }

  const hex = remove0x(value);
  if (hex.length > size * 2) {
    throw new Error(`Cannot pad 0x${hex} to ${size} bytes`);
  }

  return `0x${hex[dir === 'right' ? 'padEnd' : 'padStart'](
    size * 2,
    '0',
  )}` as Hex;
}

/**
 * Concatenates an array of hex strings into a single hex string.
 *
 * @param values - The array of hex strings to concatenate
 * @returns The concatenated hex string
 */
export function concat(values: readonly Hex[]): Hex {
  return `0x${(values as Hex[]).reduce((acc, x) => acc + remove0x(x), '')}`;
}

type IsAddressOptions = {
  /**
   * Enables strict mode. Whether or not to compare the address against its checksum.
   *
   * @default true
   */
  strict?: boolean | undefined;
};

/**
 * Checks if the given string is a valid address
 *
 * @param address - The address to check
 * @param options - Options for the function
 * @param options.strict - Enables strict mode. Whether or not to compare the address against its checksum. Defaults to `true`
 * @returns `true` if the address is valid, `false` otherwise
 */
export function isAddress(
  address: string,
  options?: IsAddressOptions | undefined,
): address is Address {
  const { strict = true } = options || {};
  const addr = address as Hex;
  return strict ? isValidChecksumAddress(addr) : isValidHexAddress(addr);
}

function normalizeSignature(signature: string): string {
  let active = true;
  let current = '';
  let level = 0;
  let result = '';
  let valid = false;

  for (let i = 0; i < signature.length; i++) {
    const char = signature[i];

    // If the character is a separator, we want to reactivate.
    if (['(', ')', ','].includes(char)) {
      active = true;
    }

    // If the character is a "level" token, we want to increment/decrement.
    if (char === '(') {
      level++;
    }
    if (char === ')') {
      level--;
    }

    // If we aren't active, we don't want to mutate the result.
    if (!active) {
      continue;
    }

    // If level === 0, we are at the definition level.
    if (level === 0) {
      if (char === ' ' && ['event', 'function', ''].includes(result)) {
        result = '';
      } else {
        result += char;

        // If we are at the end of the definition, we must be finished.
        if (char === ')') {
          valid = true;
          break;
        }
      }

      continue;
    }

    // Ignore spaces
    if (char === ' ') {
      // If the previous character is a separator, and the current section isn't empty, we want to deactivate.
      if (signature[i - 1] !== ',' && current !== ',' && current !== ',(') {
        current = '';
        active = false;
      }
      continue;
    }

    result += char;
    current += char;
  }

  if (!valid) {
    throw new Error('Unable to normalize signature.');
  }

  return result;
}

function hashSignature(fn: string) {
  return keccak(Buffer.from(stringToBytes(normalizeSignature(fn))));
}
/**
 * Returns the function selector for a given function definition.
 *
 * @param fn
 * @example
 * const selector = toFunctionSelector('function ownerOf(uint256 tokenId)')
 * // 0x6352211e
 */
export const toFunctionSelector = (fn: string): Hex => {
  return toHex(hashSignature(fn).subarray(0, 4));
};
