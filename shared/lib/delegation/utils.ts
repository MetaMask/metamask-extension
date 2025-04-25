/* eslint-disable no-plusplus */
/* eslint-disable require-unicode-regexp */
import {
  bytesToHex,
  getChecksumAddress,
  numberToHex,
  stringToBytes,
} from '@metamask/utils';
import { keccak, toBuffer } from 'ethereumjs-util';

export type Hex = `0x${string}`;
export type Address = `0x${string}`;

function stringToHex(value: string): Hex {
  return bytesToHex(stringToBytes(value));
}

function boolToHex(value: boolean): Hex {
  return `0x${Number(value)}`;
}

export function keccak256(value: Hex): Hex {
  const buf = keccak(toBuffer(value));
  const hex = buf.toString('hex');
  return `0x${hex}`;
}

export function toHex(
  value: string | number | boolean | Buffer | Uint8Array,
  { size }: { size?: number | undefined } = {},
): Hex {
  const res: Hex = (() => {
    if (value instanceof Uint8Array) {
      return `0x${Array.from(value, (byte) =>
        byte.toString(16).padStart(2, '0'),
      )}`;
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

export function isHex(
  value: unknown,
  { strict = true }: { strict?: boolean | undefined } = {},
): value is Hex {
  if (!value) {
    return false;
  }
  if (typeof value !== 'string') {
    return false;
  }
  return strict ? /^0x[0-9a-fA-F]*$/.test(value) : value.startsWith('0x');
}

type PadOptions = {
  dir?: 'left' | 'right' | undefined;
  size?: number | null | undefined;
};

export function pad(value: Hex, { dir, size = 32 }: PadOptions = {}): Hex {
  if (size === null) {
    return value;
  }
  const hex = value.replace('0x', '');
  if (hex.length > size * 2) {
    throw new Error(`Cannot pad ${hex} to ${size} bytes`);
  }

  return `0x${hex[dir === 'right' ? 'padEnd' : 'padStart'](
    size * 2,
    '0',
  )}` as Hex;
}

export function concat(values: readonly Hex[]): Hex {
  return `0x${(values as Hex[]).reduce(
    (acc, x) => acc + x.replace('0x', ''),
    '',
  )}`;
}

const addressRegex = /^0x[a-fA-F0-9]{40}$/;

export function isAddress(
  address: string,
  { strict }: { strict: boolean } = { strict: true },
): address is Address {
  if (!addressRegex.test(address)) {
    return false;
  }
  if (address.toLowerCase() === address) {
    return true;
  }
  if (strict) {
    return getChecksumAddress(address as Address) === address;
  }
  return true;
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

function hashSignature(fn: string): Hex {
  return keccak256(toHex(stringToBytes(normalizeSignature(fn))));
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
  const hash = hashSignature(fn);
  return hash.slice(0, 10) as Hex;
};
