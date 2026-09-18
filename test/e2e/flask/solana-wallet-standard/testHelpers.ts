import { strict as assert } from 'assert';
import nacl from 'tweetnacl';
import { Driver } from '../../webdriver/driver';

export type FixtureCallbackArgs = { driver: Driver; extensionId: string };

export const account1 = '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer';
export const account1Short = '4tE7...Uxer';
export const account2Short = 'ExTE...GNtt';

/**
 * Asserts that the signed message is valid.
 *
 * @param options0
 * @param options0.signedMessageBase64
 * @param options0.originalMessageString
 * @param options0.publicKeyBase58
 */
export async function assertSignedMessageIsValid({
  signedMessageBase64,
  originalMessageString,
  publicKeyBase58,
}: {
  signedMessageBase64: string;
  originalMessageString: string;
  publicKeyBase58: string;
}) {
  // To fix this issue: The current file is a CommonJS module whose imports will produce 'require' calls;
  // however, the referenced file is an ECMAScript module and cannot be imported with 'require'.
  const bs58 = (await import('bs58')).default;
  const signature = Uint8Array.from(Buffer.from(signedMessageBase64, 'base64'));
  const publicKey = bs58.decode(publicKeyBase58);
  const message = new TextEncoder().encode(originalMessageString);

  assert.strictEqual(publicKey.length, 32, 'Invalid public key length');
  assert.strictEqual(signature.length, 64, 'Invalid signature length');

  // Verify the signature
  assert.ok(
    nacl.sign.detached.verify(message, signature, publicKey),
    'Signature verification failed',
  );
}
