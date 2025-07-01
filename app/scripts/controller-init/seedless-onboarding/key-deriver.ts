import type { ToprfKeyDeriver } from '@metamask/seedless-onboarding-controller';

const TOPRF_KEY_DERIVATION_ITERATIONS = 600_000;

export const toprfKeyDeriver: ToprfKeyDeriver = {
  async deriveKey(seed: Uint8Array, salt: Uint8Array): Promise<Uint8Array> {
    const key = await globalThis.crypto.subtle.importKey(
      'raw',
      seed,
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey'],
    );
    const derivedKey = await globalThis.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: TOPRF_KEY_DERIVATION_ITERATIONS,
        hash: 'SHA-256',
      },
      key,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt'],
    );
    return new Uint8Array(await globalThis.crypto.subtle.exportKey('raw', derivedKey));
  },
};
