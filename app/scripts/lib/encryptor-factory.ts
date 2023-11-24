import * as browserPassworder from '@metamask/browser-passworder';

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
    key?: browserPassworder.EncryptionKey,
    salt?: string,
  ): Promise<string> => {
    return browserPassworder.encrypt(password, data, key, salt, {
      algorithm: 'PBKDF2',
      params: {
        iterations,
      },
    });
  };

/**
 * A factory function for the encryptWithDetail method of the browser-passworder library,
 * that encrypts with a given number of iterations.
 *
 * @param iterations - The number of iterations to use for the PBKDF2 algorithm.
 * @returns A function that encrypts with the given number of iterations.
 */
const encryptWithDetailFactory =
  (iterations: number) =>
  (password: string, object: unknown, salt?: string) => {
    return browserPassworder.encryptWithDetail(password, object, salt, {
      algorithm: 'PBKDF2',
      params: {
        iterations,
      },
    });
  };

/**
 * A factory function that returns an alternative to the updateVault method
 * of the browser-passworder library, that updates the vault to the given number of iterations.
 *
 * @param iterations - The number of iterations to use for the PBKDF2 algorithm.
 * @returns A function that updates the vault to the given number of iterations.
 */
const updateVaultFactory =
  (iterations: number) =>
  async (vault: string, password: string): Promise<string> => {
    const { keyMetadata } = JSON.parse(vault);

    if (!keyMetadata || keyMetadata.params.iterations !== iterations) {
      return encryptFactory(iterations)(
        password,
        await browserPassworder.decrypt(password, vault),
      );
    }

    return vault;
  };

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
  ...browserPassworder,
  encrypt: encryptFactory(iterations),
  encryptWithDetail: encryptWithDetailFactory(iterations),
  updateVault: updateVaultFactory(iterations),
});
