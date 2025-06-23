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

export function applyUrlSafeReplacementsToBase64String(base64String: string) {
  return base64String
    .replace(/\+/gu, '-') // Replace '+' with '-'
    .replace(/\//gu, '_') // Replace '/' with '_'
    .replace(/[=]+$/u, ''); // Remove padding characters ('=')
}

export function convertUrlSafeBase64StringToBase64String(base64String: string) {
  return base64String
    .replace(/-/gu, '+')
    .replace(/_/gu, '/')
    .replace(/[=]/gu, '');
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
  return applyUrlSafeReplacementsToBase64String(btoa(str));
}

/**
 * Decodes a base64url encoded string to a UTF-8 string with URL-safe replacements
 *
 * @param base64String - The base64url encoded string to decode
 * @returns The decoded UTF-8 string
 */
export function decodeBase64WithSafeUrlReplacements(base64String: string) {
  // Apply URL-safe replacements to the base64String BEFORE decoding
  const urlSafeBase64String =
    convertUrlSafeBase64StringToBase64String(base64String);
  const binaryString = atob(urlSafeBase64String);
  const bytes = Uint8Array.from(binaryString, (c) => c.charCodeAt(0));
  const utf8String = new TextDecoder().decode(bytes);
  return utf8String;
}

export function decodeIdToken(idToken: string): string {
  const [, idTokenPayload] = idToken.split('.');
  const base64String = convertUrlSafeBase64StringToBase64String(
    padBase64String(idTokenPayload),
  );

  return decodeBase64WithSafeUrlReplacements(base64String);
}
