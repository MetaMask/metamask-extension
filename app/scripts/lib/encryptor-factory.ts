import * as browserPassworder from '@metamask/browser-passworder';
import type { Json } from '@metamask/utils';

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
  encrypt: (
    password: string,
    data: Json,
    key?: browserPassworder.EncryptionKey,
    salt?: string,
  ) =>
    browserPassworder.encrypt(password, data, key, salt, {
      algorithm: 'PBKDF2',
      params: {
        iterations,
      },
    }),
  encryptWithDetail: (password: string, object: Json, salt?: string) =>
    browserPassworder.encryptWithDetail(password, object, salt, {
      algorithm: 'PBKDF2',
      params: {
        iterations,
      },
    }),
  updateVault: async (vault: string, password: string): Promise<string> =>
    browserPassworder.encrypt(
      password,
      await browserPassworder.decrypt(vault, password),
      undefined,
      undefined,
      {
        algorithm: 'PBKDF2',
        params: {
          iterations,
        },
      },
    ),
});
