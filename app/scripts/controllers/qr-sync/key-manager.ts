import type { IKeyManager, KeyPair } from '@metamask/mobile-wallet-protocol-core';
import { decrypt, encrypt, PrivateKey, PublicKey } from 'eciesjs';

export class KeyManager implements IKeyManager {
  generateKeyPair(): KeyPair {
    const privateKey = new PrivateKey();
    return { privateKey: new Uint8Array(privateKey.secret), publicKey: privateKey.publicKey.toBytes(true) };
  }

  validatePeerKey(key: Uint8Array): void {
    PublicKey.fromHex(Buffer.from(key).toString('utf8'));
  }

  async encrypt(plaintext: string, theirPublicKey: Uint8Array): Promise<string> {
    const plaintextBuffer = Buffer.from(plaintext, 'utf8');
    const encryptedBuffer = encrypt(theirPublicKey, plaintextBuffer);
    return encryptedBuffer.toString();
  }

  async decrypt(encryptedB64: string, myPrivateKey: Uint8Array): Promise<string> {
    const encryptedBuffer = Buffer.from(encryptedB64, 'base64');
    const decryptedBuffer = decrypt(myPrivateKey, encryptedBuffer);
    return Buffer.from(decryptedBuffer).toString('utf8');
  }
}
