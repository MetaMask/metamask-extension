import { pbkdf2 } from '@noble/hashes/pbkdf2';
import { sha256 } from '@noble/hashes/sha256';
import { utf8ToBytes, concatBytes, bytesToHex } from '@noble/hashes/utils';
import { gcm } from '@noble/ciphers/aes';
import { randomBytes } from '@noble/ciphers/webcrypto';

export type EncryptedPayload = {
  v: '1'; // version
  d: string; // data
  iterations: number;
};

function byteArrayToBase64(byteArray: Uint8Array) {
  return Buffer.from(byteArray).toString('base64');
}

function base64ToByteArray(base64: string) {
  return new Uint8Array(Buffer.from(base64, 'base64'));
}

function bytesToUtf8(byteArray: Uint8Array) {
  const decoder = new TextDecoder('utf-8');
  return decoder.decode(byteArray);
}

class EncryptorDecryptor {
  #ALGORITHM_NONCE_SIZE: number = 12; // 12 bytes

  #ALGORITHM_KEY_SIZE: number = 16; // 16 bytes

  #PBKDF2_SALT_SIZE: number = 16; // 16 bytes

  #PBKDF2_ITERATIONS: number = 900_000;

  encryptString(plaintext: string, password: string): string {
    try {
      return this.#encryptStringV1(plaintext, password);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : e;
      throw new Error(`Unable to encrypt string - ${errorMessage}`);
    }
  }

  decryptString(encryptedDataStr: string, password: string): string {
    try {
      const encryptedData: EncryptedPayload = JSON.parse(encryptedDataStr);
      if (encryptedData.v === '1') {
        return this.#decryptStringV1(encryptedData, password);
      }
      throw new Error(`Unsupported encrypted data payload - ${encryptedData}`);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : e;
      throw new Error(`Unable to decrypt string - ${errorMessage}`);
    }
  }

  #encryptStringV1(plaintext: string, password: string): string {
    const salt = randomBytes(this.#PBKDF2_SALT_SIZE);

    // Derive a key using PBKDF2.
    const key = pbkdf2(sha256, password, salt, {
      c: this.#PBKDF2_ITERATIONS,
      dkLen: this.#ALGORITHM_KEY_SIZE,
    });

    // Encrypt and prepend salt.
    const plaintextRaw = utf8ToBytes(plaintext);
    const ciphertextAndNonceAndSalt = concatBytes(
      salt,
      this.#encrypt(plaintextRaw, key),
    );

    // Convert to Base64
    const encryptedData = byteArrayToBase64(ciphertextAndNonceAndSalt);

    const encryptedPayload: EncryptedPayload = {
      v: '1',
      d: encryptedData,
      iterations: this.#PBKDF2_ITERATIONS,
    };

    return JSON.stringify(encryptedPayload);
  }

  #decryptStringV1(data: EncryptedPayload, password: string): string {
    const { iterations, d: base64CiphertextAndNonceAndSalt } = data;

    // Decode the base64.
    const ciphertextAndNonceAndSalt = base64ToByteArray(
      base64CiphertextAndNonceAndSalt,
    );

    // Create buffers of salt and ciphertextAndNonce.
    const salt = ciphertextAndNonceAndSalt.slice(0, this.#PBKDF2_SALT_SIZE);
    const ciphertextAndNonce = ciphertextAndNonceAndSalt.slice(
      this.#PBKDF2_SALT_SIZE,
      ciphertextAndNonceAndSalt.length,
    );

    // Derive the key using PBKDF2.
    const key = pbkdf2(sha256, password, salt, {
      c: iterations,
      dkLen: this.#ALGORITHM_KEY_SIZE,
    });

    // Decrypt and return result.
    return bytesToUtf8(this.#decrypt(ciphertextAndNonce, key));
  }

  #encrypt(plaintext: Uint8Array, key: Uint8Array): Uint8Array {
    const nonce = randomBytes(this.#ALGORITHM_NONCE_SIZE);

    // Encrypt and prepend nonce.
    const ciphertext = gcm(key, nonce).encrypt(plaintext);

    return concatBytes(nonce, ciphertext);
  }

  #decrypt(ciphertextAndNonce: Uint8Array, key: Uint8Array): Uint8Array {
    // Create buffers of nonce and ciphertext.
    const nonce = ciphertextAndNonce.slice(0, this.#ALGORITHM_NONCE_SIZE);
    const ciphertext = ciphertextAndNonce.slice(
      this.#ALGORITHM_NONCE_SIZE,
      ciphertextAndNonce.length,
    );

    // Decrypt and return result.
    return gcm(key, nonce).decrypt(ciphertext);
  }
}

const encryption = new EncryptorDecryptor();
export default encryption;

export function createSHA256Hash(data: string): string {
  const hashedData = sha256(data);
  return bytesToHex(hashedData);
}
