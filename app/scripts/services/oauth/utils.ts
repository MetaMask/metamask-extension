/**
 * Pads a string to a length of 4 characters
 *
 * @param input - The base64 encoded string to pad
 * @returns The padded string
 */
export function padBase64String(input: string) {
  const segmentLength = 4;
  const stringLength = input.length;
  const diff = stringLength % segmentLength;
  if (!diff) {
    return input;
  }
  let position = stringLength;
  let padLength = segmentLength - diff;
  const paddedStringLength = stringLength + padLength;
  const buffer = Buffer.alloc(paddedStringLength);
  buffer.write(input);
  while (padLength > 0) {
    buffer.write('=', position);
    position += 1;
    padLength -= 1;
  }
  return buffer.toString();
}

/**
 * Encodes a buffer to a base64url encoded string
 *
 * @param buffer - The buffer to encode
 * @returns The base64url encoded string
 */
export function base64urlencode(buffer: ArrayBuffer) {
  let str = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  return btoa(str)
    .replace(/\+/gu, '-')
    .replace(/\//gu, '_')
    .replace(/[=]+$/gu, '');
}

export function decodeIdToken(idToken: string): string {
  const [, idTokenPayload] = idToken.split('.');
  const base64String = padBase64String(idTokenPayload)
    .replace(/-/u, '+')
    .replace(/_/u, '/');
  // Using buffer here instead of atob because userinfo can contain emojis which are not supported by atob
  // the browser replacement for atob is https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array/fromBase64
  // which is not supported in all chrome yet
  return Buffer.from(base64String, 'base64').toString('utf-8');
}
