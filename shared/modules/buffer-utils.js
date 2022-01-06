import { toBuffer as ethUtilToBuffer, isHexString } from 'ethereumjs-util';

/**
 * Returns a buffer from the provided input, via ethereumjs-util.toBuffer but
 * additionally handling non hex strings. This is a failsafe as in most cases
 * we should be primarily dealing with hex prefixed strings with this utility
 * but we do not want to break the extension for users.
 * @param {import('ethereumjs-util').ToBufferInputTypes | string} input
 * @returns {Buffer}
 */
export function toBuffer(input) {
  if (typeof input === 'string' && isHexString(input) === false) {
    return Buffer.from(input);
  }
  return ethUtilToBuffer(input);
}
