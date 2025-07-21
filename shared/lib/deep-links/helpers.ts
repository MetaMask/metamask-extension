/* eslint-disable no-bitwise, no-plusplus */
import log from 'loglevel';
import { hasProperty } from '@metamask/utils';
import { getManifestFlags } from '../manifestFlags';

/**
 * Decodes a base64Url character to its corresponding 6-bit value.
 *
 * Its really fast.
 *
 * @param c - A character code (number) representing a base64Url character.
 * The character code should be in the range of 0x30 to 0x7a (0-127).
 * @returns A number representing the decoded value of the base64Url character.
 */
function decode6(c: number): number {
  // ranges
  const mAZ = ~((c - 0x41) | (0x5a - c)) >> 31; // 'A'..'Z'
  const maz = ~((c - 0x61) | (0x7a - c)) >> 31; // 'a'..'z'
  const m09 = ~((c - 0x30) | (0x39 - c)) >> 31; // '0'..'9'

  // URL-safe single-bytes ("-" for "+" and "_" for "/")
  const m62 = ~((c - 0x2d) | (0x2d - c)) >> 31; // '-' (replaces +)
  const m63 = ~((c - 0x5f) | (0x5f - c)) >> 31; // '_' (replaces /)

  // combine
  return (
    ((c - 0x41) & mAZ) | // 0-25
    ((c - 0x47) & maz) | // 26-51 (c-71)
    ((c + 4) & m09) | // 52-61
    (62 & m62) | // 62
    (63 & m63) // 63
  );
}

/**
 * Converts our `sig` parameter, which is a base64 url-encoded string without
 * padding, with amn exactly output byte length of 64, into a Uint8Array of 64
 * bytes.
 *
 * This function assumes the input is a valid base64url string without padding.
 * If the input is bad, the output will be too.
 *
 * @param sig - The sig string to convert
 */
export const sigToBytes = Object.hasOwn(Uint8Array, 'fromBase64')
  ? function sigToBytes(sig: string) {
      // @ts-expect-error `fromBase64` is a static method on Uint8Array in
      // modern browsers. 5% faster than the alternative implementation.
      // see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array/fromBase64#browser_compatibility
      return Uint8Array.fromBase64(sig, {
        alphabet: 'base64url',
      }) as Uint8Array;
    }
  : // old browsers
    function sigToBytes(sig: string) {
      const out = new Uint8Array(64);
      let o = 0;

      /* 84 chars → 21 blocks → 63 bytes */
      for (let i = 0; i < 84; i += 4) {
        const w =
          (decode6(sig.charCodeAt(i)) << 18) |
          (decode6(sig.charCodeAt(i + 1)) << 12) |
          (decode6(sig.charCodeAt(i + 2)) << 6) |
          decode6(sig.charCodeAt(i + 3));

        out[o++] = w >>> 16; // byte 0
        out[o++] = (w >>> 8) & 255; // byte 1
        out[o++] = w & 255; // byte 2
      }

      /* tail: 2 chars → 1 byte */
      out[o] =
        (decode6(sig.charCodeAt(84)) << 2) |
        (decode6(sig.charCodeAt(85)) >>> 4);

      return out;
    };

/**
 * Converts a standard, padded, base64 string to a Uint8Array.
 *
 * @param base64 - The base64 string to convert.
 * @returns The resulting Uint8Array.
 */
export const base64ToUint8Array = hasProperty(Uint8Array, 'fromBase64')
  ? // modern browsers
    (Uint8Array.fromBase64 as (base64: string) => Uint8Array)
  : function base64ToUint8Array(base64: string) {
      // old browsers
      const binaryString = atob(base64);
      return Uint8Array.from(binaryString, (c) => c.charCodeAt(0));
    };

/**
 * Retrieves the public key data for deep link verification.
 *
 * If the application is in test mode, it will use the public key from the
 * manifest flags, if there is one.
 *
 * If not in test mode, it will use the public key from the environment
 * variable `DEEP_LINK_PUBLIC_KEY`.
 */
export function getKeyData() {
  if (process.env.IN_TEST) {
    const testKey = getManifestFlags().testing?.deepLinkPublicKey;
    if (testKey) {
      log.debug(
        'IN_TEST: Using deep link public key found key at `getManifestFlags().testing?.deepLinkPublicKey`',
      );
      return base64ToUint8Array(testKey);
    }
  }

  return base64ToUint8Array(process.env.DEEP_LINK_PUBLIC_KEY as string);
}
