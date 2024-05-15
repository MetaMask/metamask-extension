import { scrypt } from '@noble/hashes/scrypt';
import { sha256 } from '@noble/hashes/sha256';
import { utf8ToBytes, concatBytes, bytesToHex } from '@noble/hashes/utils';
import { gcm } from '@noble/ciphers/aes';
import { randomBytes } from '@noble/ciphers/webcrypto';

export type EncryptedPayload = {
  // version
  v: '1';

  // encryption type - script
  t: 'script';

  // data
  d: string;

  // encryption options - script
  o: {
    N: number;
    r: number;
    p: number;
    dkLen: number;
  };
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

  #SCRYPT_SALT_SIZE: number = 16; // 16 bytes

  #SCRYPT_N: number = 2 ** 14; // CPU/memory cost parameter (must be a power of 2, > 1)

  #SCRYPT_r: number = 8; // Block size parameter

  #SCRYPT_p: number = 1; // Parallelization parameter

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
        if (encryptedData.t === 'script') {
          return this.#decryptStringV1(encryptedData, password);
        }
      }
      throw new Error(`Unsupported encrypted data payload - ${encryptedData}`);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : e;
      throw new Error(`Unable to decrypt string - ${errorMessage}`);
    }
  }

  #encryptStringV1(plaintext: string, password: string): string {
    const salt = randomBytes(this.#SCRYPT_SALT_SIZE);

    // Derive a key using PBKDF2.
    const key = scrypt(password, salt, {
      N: this.#SCRYPT_N,
      r: this.#SCRYPT_r,
      p: this.#SCRYPT_p,
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
      t: 'script',
      d: encryptedData,
      o: {
        N: this.#SCRYPT_N,
        r: this.#SCRYPT_r,
        p: this.#SCRYPT_p,
        dkLen: this.#ALGORITHM_KEY_SIZE,
      },
    };

    return JSON.stringify(encryptedPayload);
  }

  #decryptStringV1(data: EncryptedPayload, password: string): string {
    const { o, d: base64CiphertextAndNonceAndSalt } = data;

    // Decode the base64.
    const ciphertextAndNonceAndSalt = base64ToByteArray(
      base64CiphertextAndNonceAndSalt,
    );

    // Create buffers of salt and ciphertextAndNonce.
    const salt = ciphertextAndNonceAndSalt.slice(0, this.#SCRYPT_SALT_SIZE);
    const ciphertextAndNonce = ciphertextAndNonceAndSalt.slice(
      this.#SCRYPT_SALT_SIZE,
      ciphertextAndNonceAndSalt.length,
    );

    // Derive the key using PBKDF2.
    const key = scrypt(password, salt, {
      N: o.N,
      r: o.r,
      p: o.p,
      dkLen: o.dkLen,
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
