import type { IKeyManager, KeyPair } from '@metamask/mobile-wallet-protocol-core';
import { encryptorFactory } from 'app/scripts/lib/encryptor-factory';

const encryptor = encryptorFactory(600_000);

export class KeyManager implements IKeyManager {
  generateKeyPair(): KeyPair {
    throw new Error('Not implemented');
  }

  async encrypt(data: string): Promise<string> {
    throw new Error('Not implemented');
  }

  async decrypt(data: string): Promise<string> {
    throw new Error('Not implemented');
  }

  validatePeerKey(key: Uint8Array<ArrayBufferLike>): void {
    // TODO:
    // assert that the key is a valid public key
    throw new Error('Not implemented');
  }
}
