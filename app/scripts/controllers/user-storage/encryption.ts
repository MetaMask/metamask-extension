import sjcl from 'sjcl';

// Encryption / Decryption taken from - https://github.com/luke-park/SecureCompatibleEncryptionExamples/blob/master/TypeScript/SCEE-sjcl.ts
class EncryptorDecryptor {
  #BITS_PER_WORD = 32;

  #ALGORITHM_NONCE_SIZE = 3; // 32-bit words.

  #ALGORITHM_KEY_SIZE = 4; // 32-bit words.

  #PBKDF2_SALT_SIZE = 4; // 32-bit words.

  #PBKDF2_ITERATIONS = 32767;

  encryptString = (plaintext: string, password: string): string => {
    // Generate a 128-bit salt using a CSPRNG.
    const salt = sjcl.random.randomWords(this.#PBKDF2_SALT_SIZE);

    // Derive a key using PBKDF2.
    const key = sjcl.misc.pbkdf2(
      password,
      salt,
      this.#PBKDF2_ITERATIONS,
      this.#ALGORITHM_KEY_SIZE * this.#BITS_PER_WORD,
    );

    // Encrypt and prepend salt.
    const plaintextRaw = sjcl.codec.utf8String.toBits(plaintext);
    const ciphertextAndNonceAndSalt = sjcl.bitArray.concat(
      salt,
      this.#encrypt(plaintextRaw, key),
    );

    return sjcl.codec.base64.fromBits(ciphertextAndNonceAndSalt);
  };

  decryptString = (
    base64CiphertextAndNonceAndSalt: string,
    password: string,
  ): string => {
    // Decode the base64.
    const ciphertextAndNonceAndSalt = sjcl.codec.base64.toBits(
      base64CiphertextAndNonceAndSalt,
    );

    // Create buffers of salt and ciphertextAndNonce.
    const salt = sjcl.bitArray.bitSlice(
      ciphertextAndNonceAndSalt,
      0,
      this.#PBKDF2_SALT_SIZE * this.#BITS_PER_WORD,
    );

    const ciphertextAndNonce = sjcl.bitArray.bitSlice(
      ciphertextAndNonceAndSalt,
      this.#PBKDF2_SALT_SIZE * this.#BITS_PER_WORD,
      ciphertextAndNonceAndSalt.length * this.#BITS_PER_WORD,
    );

    // Derive the key using PBKDF2.
    const key = sjcl.misc.pbkdf2(
      password,
      salt,
      this.#PBKDF2_ITERATIONS,
      this.#ALGORITHM_KEY_SIZE * this.#BITS_PER_WORD,
    );

    // Decrypt and return result.
    return sjcl.codec.utf8String.fromBits(
      this.#decrypt(ciphertextAndNonce, key),
    );
  };

  #encrypt = (plaintext: sjcl.BitArray, key: number[]): sjcl.BitArray => {
    // Generate a 96-bit nonce using a CSPRNG.
    const nonce = sjcl.random.randomWords(this.#ALGORITHM_NONCE_SIZE);

    // Encrypt and prepend nonce.
    const ciphertext = sjcl.mode.gcm.encrypt(
      // eslint-disable-next-line new-cap
      new sjcl.cipher.aes(key),
      plaintext,
      nonce,
    );

    return sjcl.bitArray.concat(nonce, ciphertext);
  };

  #decrypt = (
    ciphertextAndNonce: sjcl.BitArray,
    key: number[],
  ): sjcl.BitArray => {
    // Create buffers of nonce and ciphertext.
    const nonce = sjcl.bitArray.bitSlice(
      ciphertextAndNonce,
      0,
      this.#ALGORITHM_NONCE_SIZE * this.#BITS_PER_WORD,
    );

    const ciphertext = sjcl.bitArray.bitSlice(
      ciphertextAndNonce,
      this.#ALGORITHM_NONCE_SIZE * this.#BITS_PER_WORD,
      ciphertextAndNonce.length * this.#BITS_PER_WORD,
    );

    // Decrypt and return result.
    // eslint-disable-next-line new-cap
    return sjcl.mode.gcm.decrypt(new sjcl.cipher.aes(key), ciphertext, nonce);
  };
}

const encryption = new EncryptorDecryptor();
export default encryption;

export function createSHA256Hash(data: string): string {
  const hashedData = sjcl.hash.sha256.hash(data);
  return sjcl.codec.hex.fromBits(hashedData);
}
