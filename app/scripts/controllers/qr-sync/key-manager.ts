import type {
  IKeyManager,
  KeyPair,
} from '@metamask/mobile-wallet-protocol-core';
import {
  base64ToBytes,
  bytesToBase64,
  bytesToHex,
  bytesToString,
  stringToBytes,
} from '@metamask/utils';
import { decrypt, encrypt, PrivateKey, PublicKey } from 'eciesjs';

export class KeyManager implements IKeyManager {
  generateKeyPair(): KeyPair {
    const privateKey = new PrivateKey();
    return {
      privateKey: new Uint8Array(privateKey.secret),
      publicKey: privateKey.publicKey.toBytes(true),
    };
  }

  validatePeerKey(key: Uint8Array): void {
    const keyHex = bytesToHex(key);
    PublicKey.fromHex(keyHex);
  }

  async encrypt(
    plaintext: string,
    theirPublicKey: Uint8Array,
  ): Promise<string> {
    const plaintextBuffer = stringToBytes(plaintext);
    const encryptedBuffer = encrypt(theirPublicKey, plaintextBuffer);
    return bytesToBase64(encryptedBuffer);
  }

  async decrypt(
    encryptedB64: string,
    myPrivateKey: Uint8Array,
  ): Promise<string> {
    const encryptedBuffer = base64ToBytes(encryptedB64);
    const decryptedBuffer = await decrypt(myPrivateKey, encryptedBuffer);
    return bytesToString(decryptedBuffer);
  }
}
