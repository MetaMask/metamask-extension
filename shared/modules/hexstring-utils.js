import BN from 'bn.js';
import createKeccakHash from 'keccak';
import {
  isHexPrefixed,
  isHexString,
  padToEven,
  stripHexPrefix,
  intToBuffer,
} from 'ethjs-util';

export {
  BN,
  isHexPrefixed,
  isHexString,
  padToEven,
  stripHexPrefix,
  intToBuffer,
};

// modified from ethereum-cryptography
function keccak256(msg) {
  const hash = createKeccakHash('keccak256');
  hash.update(msg);
  return Buffer.from(hash.digest());
}

/**
 * Type output options
 */
const TypeOutput = {};
TypeOutput[(TypeOutput.Number = 0)] = 'Number';
TypeOutput[(TypeOutput.BN = 1)] = 'BN';
TypeOutput[(TypeOutput.Buffer = 2)] = 'Buffer';
TypeOutput[(TypeOutput.PrefixedHexString = 3)] = 'PrefixedHexString';

/**
 * Throws if input is not a string
 * @param {string} input value to check
 */
function assertIsString(input) {
  if (typeof input !== 'string') {
    const msg = `This method only supports strings but input was: ${input}`;
    throw new Error(msg);
  }
}

/**
 * Returns the zero address.
 */
export function zeroAddress() {
  const addressLength = 20;
  const addr = zeros(addressLength);
  return bufferToHex(addr);
}

/**
 * Returns a buffer filled with 0s.
 * @param bytes the number of bytes the buffer should be
 */
export function zeros(bytes) {
  return Buffer.allocUnsafe(bytes).fill(0);
}

/**
 * Converts a `Buffer` into a `0x`-prefixed hex `String`.
 * @param buf `Buffer` object to convert
 */
export function bufferToHex(buf) {
  const out = toBuffer(buf);
  return `0x${out.toString('hex')}`;
}

/**
 * Attempts to turn a value into a `Buffer`.
 * Inputs supported: `Buffer`, `String` (hex-prefixed), `Number`, null/undefined, `BN` and other objects
 * with a `toArray()` or `toBuffer()` method.
 * @param v the value
 */
export function toBuffer(v) {
  if (v === null || v === undefined) {
    return Buffer.allocUnsafe(0);
  }
  if (Buffer.isBuffer(v)) {
    return Buffer.from(v);
  }
  if (Array.isArray(v) || v instanceof Uint8Array) {
    return Buffer.from(v);
  }
  if (typeof v === 'string') {
    if (!isHexString(v)) {
      throw new Error(
        `Cannot convert string to buffer. toBuffer only supports 0x-prefixed hex strings and this string was given: ${v}`,
      );
    }
    return Buffer.from(padToEven(stripHexPrefix(v)), 'hex');
  }
  if (typeof v === 'number') {
    return intToBuffer(v);
  }
  if (BN.isBN(v)) {
    return v.toArrayLike(Buffer);
  }
  if (v.toArray) {
    // converts a BN to a Buffer
    return Buffer.from(v.toArray());
  }
  if (v.toBuffer) {
    return Buffer.from(v.toBuffer());
  }
  throw new Error('invalid type');
}

/**
 * Adds "0x" to a given `String` if it does not already start with "0x".
 */
export function addHexPrefix(str) {
  if (typeof str !== 'string') {
    return str;
  }
  return isHexPrefixed(str) ? str : `0x${str}`;
}

/**
 * Checks if the address is a valid. Accepts checksummed addresses too.
 */
export function isValidAddress(hexAddress) {
  try {
    assertIsString(hexAddress);
  } catch (e) {
    return false;
  }
  return /^0x[0-9a-fA-F]{40}$/u.test(hexAddress);
}

/**
 * Returns a checksummed address.
 *
 * If a eip1191ChainId is provided, the chainId will be included in the checksum calculation. This
 * has the effect of checksummed addresses for one chain having invalid checksums for others.
 * For more details see [EIP-1191](https://eips.ethereum.org/EIPS/eip-1191).
 *
 * WARNING: Checksums with and without the chainId will differ. As of 2019-06-26, the most commonly
 * used variation in Ethereum was without the chainId. This may change in the future.
 */
export function toChecksumAddress(hexAddress, eip1191ChainId) {
  assertIsHexString(hexAddress);
  const address = stripHexPrefix(hexAddress).toLowerCase();
  let prefix = '';
  if (eip1191ChainId) {
    const chainId = toType(eip1191ChainId, TypeOutput.BN);
    prefix = `${chainId.toString()}0x`;
  }
  const hash = keccakFromString(prefix + address).toString('hex');
  let ret = '0x';
  for (let i = 0; i < address.length; i++) {
    if (parseInt(hash[i], 16) >= 8) {
      ret += address[i].toUpperCase();
    } else {
      ret += address[i];
    }
  }
  return ret;
}
/**
 * Checks if the address is a valid checksummed address.
 *
 * See toChecksumAddress' documentation for details about the eip1191ChainId parameter.
 */
export function isValidChecksumAddress(hexAddress, eip1191ChainId) {
  return (
    isValidAddress(hexAddress) &&
    toChecksumAddress(hexAddress, eip1191ChainId) === hexAddress
  );
}

/**
 * Throws if a string is not hex prefixed
 * @param {string} input string to check hex prefix of
 */
export function assertIsHexString(input) {
  if (!isHexString(input)) {
    const msg = `This method only supports 0x-prefixed hex strings but input was: ${input}`;
    throw new Error(msg);
  }
}

/**
 * Convert an input to a specified type
 * @param input value to convert
 * @param outputType type to output
 */
function toType(input, outputType) {
  if (typeof input === 'string' && !isHexString(input)) {
    throw new Error(
      `A string must be provided with a 0x-prefix, given: ${input}`,
    );
  } else if (typeof input === 'number' && !Number.isSafeInteger(input)) {
    throw new Error(
      'The provided number is greater than MAX_SAFE_INTEGER (please use an alternative input type)',
    );
  }
  const output = toBuffer(input);
  if (outputType === TypeOutput.Buffer) {
    return output;
  } else if (outputType === TypeOutput.BN) {
    return new BN(output);
  } else if (outputType === TypeOutput.Number) {
    const bn = new BN(output);
    const max = new BN(Number.MAX_SAFE_INTEGER.toString());
    if (bn.gt(max)) {
      throw new Error(
        'The provided number is greater than MAX_SAFE_INTEGER (please use an alternative output type)',
      );
    }
    return bn.toNumber();
  }

  // outputType === TypeOutput.PrefixedHexString
  return `0x${output.toString('hex')}`;
}

/**
 * Creates Keccak hash of a utf-8 string input
 * @param a The input data (String)
 * @param bits (number = 256) The Keccak width
 */
export function keccakFromString(a, bits = 256) {
  assertIsString(a);
  const buf = Buffer.from(a, 'utf8');
  return keccak(buf, bits);
}

/**
 * Creates Keccak hash of a Buffer input
 * @param a The input data (Buffer)
 * @param bits (number = 256) The Keccak width
 */
export function keccak(a, bits = 256) {
  assertIsBuffer(a);
  if (bits !== 256) {
    throw new Error('only keccak256 supported');
  }
  return keccak256(a);
}

/**
 * Throws if input is not a buffer
 * @param {Buffer} input value to check
 */
export function assertIsBuffer(input) {
  if (!Buffer.isBuffer(input)) {
    const msg = `This method only supports Buffer but input was: ${input}`;
    throw new Error(msg);
  }
}
