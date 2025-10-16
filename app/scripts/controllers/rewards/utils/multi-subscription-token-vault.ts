// import browser from 'webextension-polyfill';
// import type {
//   EncryptionKey,
//   EncryptionResult,
// } from '@metamask/browser-passworder';
// import { encryptorFactory } from '../../../lib/encryptor-factory';

// const STORAGE_KEY = 'REWARDS_SUBSCRIPTION_TOKENS_ENCRYPTED';
// const encryptor = encryptorFactory(600_000);

// export type TokenResponse = {
//   success: boolean;
//   token?: string;
//   error?: string;
// };

// type EncryptedTokensRecord = Record<string, string>; // subscriptionId -> JSON stringified EncryptionResult

// async function readEncryptedTokens(): Promise<EncryptedTokensRecord> {
//   const result = await browser.storage.local.get(STORAGE_KEY);
//   const value = result[STORAGE_KEY];
//   if (!value) {
//     return {};
//   }
//   try {
//     return JSON.parse(value) as EncryptedTokensRecord;
//   } catch {
//     return {};
//   }
// }

// async function writeEncryptedTokens(
//   record: EncryptedTokensRecord,
// ): Promise<void> {
//   await browser.storage.local.set({ [STORAGE_KEY]: JSON.stringify(record) });
// }

// /**
//  * Store a session token for a specific subscription (encrypted-at-rest).
//  *
//  * @param subscriptionId - The subscription identifier.
//  * @param token - The bearer/subscription token to store.
//  * @param encryptionKey - The encryption key to encrypt the token payload.
//  */
// export async function storeSubscriptionToken(
//   subscriptionId: string,
//   token: string,
//   encryptionKey?: EncryptionKey,
// ): Promise<TokenResponse> {
//   try {
//     if (!encryptionKey) {
//       return { success: false, error: 'Encryption key is required' };
//     }

//     const encrypted: EncryptionResult = await encryptor.encryptWithKey(
//       encryptionKey,
//       { token },
//     );
//     const encryptedTokens = await readEncryptedTokens();
//     encryptedTokens[subscriptionId] = JSON.stringify(encrypted);
//     await writeEncryptedTokens(encryptedTokens);
//     return { success: true };
//   } catch (error) {
//     return { success: false, error: (error as Error).message };
//   }
// }

// /**
//  * Get a session token for a specific subscription (requires encryptionKey).
//  *
//  * @param subscriptionId - The subscription identifier.
//  * @param encryptionKey - The encryption key to decrypt the token payload.
//  */
// export async function getSubscriptionToken(
//   subscriptionId: string,
//   encryptionKey?: EncryptionKey,
// ): Promise<TokenResponse> {
//   try {
//     if (!encryptionKey) {
//       return { success: false, error: 'Encryption key is required' };
//     }
//     const encryptedTokens = await readEncryptedTokens();
//     const encryptedString = encryptedTokens[subscriptionId];
//     if (!encryptedString) {
//       return {
//         success: false,
//         error: `No token found for subscription ${subscriptionId}`,
//       };
//     }
//     const encrypted = JSON.parse(encryptedString) as EncryptionResult;
//     const decrypted = (await encryptor.decryptWithKey(
//       encryptionKey,
//       encrypted,
//     )) as { token?: string };
//     if (!decrypted?.token) {
//       return { success: false, error: 'Failed to decrypt token' };
//     }
//     return { success: true, token: decrypted.token };
//   } catch (error) {
//     return { success: false, error: (error as Error).message };
//   }
// }

// /**
//  * Get all subscription tokens (decrypted).
//  *
//  * @param encryptionKey - The encryption key to decrypt token payloads.
//  */
// export async function getSubscriptionTokens(
//   encryptionKey?: EncryptionKey,
// ): Promise<{
//   success: boolean;
//   tokens?: Record<string, string>;
//   error?: string;
// }> {
//   try {
//     if (!encryptionKey) {
//       return { success: false, error: 'Encryption key is required' };
//     }
//     const encryptedTokens = await readEncryptedTokens();
//     const tokens: Record<string, string> = {};
//     for (const [subscriptionId, encryptedString] of Object.entries(
//       encryptedTokens,
//     )) {
//       try {
//         const encrypted = JSON.parse(encryptedString) as EncryptionResult;
//         const decrypted = (await encryptor.decryptWithKey(
//           encryptionKey,
//           encrypted,
//         )) as { token?: string };
//         if (decrypted?.token) {
//           tokens[subscriptionId] = decrypted.token;
//         }
//       } catch {
//         // skip corrupt entries
//       }
//     }
//     return { success: true, tokens };
//   } catch (error) {
//     return { success: false, error: (error as Error).message };
//   }
// }

// /**
//  * Remove a token for a specific subscription.
//  *
//  * @param subscriptionId - The subscription identifier to remove.
//  */
// export async function removeSubscriptionToken(
//   subscriptionId: string,
// ): Promise<TokenResponse> {
//   try {
//     const encryptedTokens = await readEncryptedTokens();
//     if (encryptedTokens[subscriptionId]) {
//       delete encryptedTokens[subscriptionId];
//       await writeEncryptedTokens(encryptedTokens);
//     }
//     return { success: true };
//   } catch (error) {
//     return { success: false, error: (error as Error).message };
//   }
// }

// /**
//  * Clear all subscription tokens (encrypted data is removed from storage).
//  */
// export async function resetAllSubscriptionTokens(): Promise<void> {
//   await browser.storage.local.remove(STORAGE_KEY);
// }
