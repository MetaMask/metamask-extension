export function byteArrayToBase64(byteArray: Uint8Array) {
  return Buffer.from(byteArray).toString('base64');
}

export function base64ToByteArray(base64: string) {
  return new Uint8Array(Buffer.from(base64, 'base64'));
}

export function bytesToUtf8(byteArray: Uint8Array) {
  const decoder = new TextDecoder('utf-8');
  return decoder.decode(byteArray);
}
