import {
  encrypt,
  encryptWithDetail,
  encryptWithKey,
  decrypt,
  decryptWithDetail,
  decryptWithKey,
  isVaultUpdated,
  keyFromPassword,
  importKey,
  EncryptionKey,
} from '@metamask/browser-passworder';

/**
 * A factory function for the encrypt method of the browser-passworder library,
 * that encrypts with a given number of iterations.
 *
 * @param iterations - The number of iterations to use for the PBKDF2 algorithm.
 * @returns A function that encrypts with the given number of iterations.
 */
const encryptFactory =
  (iterations: number) =>
  async (
    password: string,
    data: unknown,
    key?: EncryptionKey | CryptoKey,
    salt?: string,
  ) =>
    encrypt(password, data, key, salt, {
      algorithm: 'PBKDF2',
      params: {
        iterations,
      },
    });

/**
 * A factory function for the encryptWithDetail method of the browser-passworder library,
 * that encrypts with a given number of iterations.
 *
 * @param iterations - The number of iterations to use for the PBKDF2 algorithm.
 * @returns A function that encrypts with the given number of iterations.
 */
const encryptWithDetailFactory =
  (iterations: number) =>
  async (password: string, object: unknown, salt?: string) =>
    encryptWithDetail(password, object, salt, {
      algorithm: 'PBKDF2',
      params: {
        iterations,
      },
    });

/**
 * A factory function for the isVaultUpdated method of the browser-passworder library,
 * that checks if the given vault was encrypted with the given number of iterations.
 *
 * @param iterations - The number of iterations to use for the PBKDF2 algorithm.
 * @returns A function that checks if the vault was encrypted with the given number of iterations.
 */
const isVaultUpdatedFactory = (iterations: number) => async (vault: string) =>
  isVaultUpdated(vault, {
    algorithm: 'PBKDF2',
    params: {
      iterations,
    },
  });

/**
 * A factory function that returns an encryptor with the given number of iterations.
 *
 * The returned encryptor is a wrapper around the browser-passworder library, that
 * calls the encrypt and encryptWithDetail methods with the given number of iterations.
 *
 * @param iterations - The number of iterations to use for the PBKDF2 algorithm.
 * @returns An encryptor set with the given number of iterations.
 */
export const encryptorFactory = (iterations: number) => ({
  encrypt: encryptFactory(iterations),
  encryptWithKey,
  encryptWithDetail: encryptWithDetailFactory(iterations),
  decrypt,
  decryptWithKey,
  decryptWithDetail,
  keyFromPassword,
  isVaultUpdated: isVaultUpdatedFactory(iterations),
  importKey,
});
