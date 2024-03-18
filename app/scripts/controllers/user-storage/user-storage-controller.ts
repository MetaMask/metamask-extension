import {
  BaseController,
  RestrictedControllerMessenger,
} from '@metamask/base-controller';
import { HandleSnapRequest } from '@metamask/snaps-controllers';
import { createSnapSignMessageRequest } from './auth-snap-requests';
import { getUserStorage, upsertUserStorage } from './services';
import { UserStorageEntryKeys } from './schema';
import { createSHA256Hash } from './encryption';

const controllerName = 'UserStorageController';

type UserStorageControllerState = Record<string, never>;

type CreateActionsObj<T extends keyof UserStorageController> = {
  [K in T]: {
    type: `${typeof controllerName}:${K}`;
    handler: UserStorageController[K];
  };
};
type ActionsObj = CreateActionsObj<
  'performGetStorage' | 'performSetStorage' | 'getStorageKey'
>;
export type Actions = ActionsObj[keyof ActionsObj];
export type UserStorageControllerPerformGetStorage =
  ActionsObj['performGetStorage'];
export type UserStorageControllerPerformSetStorage =
  ActionsObj['performSetStorage'];
export type UserStorageControllerGetStorageKey = ActionsObj['getStorageKey'];

// Allowed Actions
type AllowedActions = HandleSnapRequest;

// Messenger
export type UserStorageControllerMessenger = RestrictedControllerMessenger<
  typeof controllerName,
  Actions | AllowedActions,
  never,
  AllowedActions['type'],
  never
>;

type AuthParams = {
  getBearerToken: () => Promise<string | null>;
  getSessionIdentifier: () => Promise<string | null>;
};

/**
 * Reusable controller that allows any team to store synchronized data for a given user.
 * These can be settings shared cross MetaMask clients, or data we want to persist when uninstalling/reinstalling.
 *
 * NOTE:
 * - data stored on UserStorage is FULLY encrypted, with the only keys stored/managed on the client.
 * - No one can access this data unless they are have the SRP and are able to run the signing snap.
 */
export default class UserStorageController extends BaseController<
  typeof controllerName,
  UserStorageControllerState,
  UserStorageControllerMessenger
> {
  #auth: AuthParams;

  constructor(messenger: UserStorageControllerMessenger, auth: AuthParams) {
    super({
      messenger,
      metadata: {},
      name: controllerName,
      state: {},
    });

    this.#auth = auth;
  }

  /**
   * Allows retrieval of stored data. Data stored is string formatted.
   * Developers can extend the entry path and entry name through the `schema.ts` file.
   *
   * @param entryKey
   * @returns the decrypted string contents found from user storage (or null if not found)
   */
  public async performGetStorage(
    entryKey: UserStorageEntryKeys,
  ): Promise<string | null> {
    const { bearerToken, storageKey } =
      await this.#getStorageKeyAndBearerToken();
    const result = await getUserStorage({
      entryKey,
      bearerToken,
      storageKey,
    });

    return result;
  }

  /**
   * Allows storage of user data. Data stored must be string formatted.
   * Developers can extend the entry path and entry name through the `schema.ts` file.
   *
   * @param entryKey
   * @param value - The string data you want to store.
   * @returns nothing. NOTE that an error is thrown if fails to store data.
   */
  public async performSetStorage(
    entryKey: UserStorageEntryKeys,
    value: string,
  ): Promise<void> {
    const { bearerToken, storageKey } =
      await this.#getStorageKeyAndBearerToken();

    await upsertUserStorage(value, {
      entryKey,
      bearerToken,
      storageKey,
    });
  }

  /**
   * Retrieves the storage key, for internal use only!
   *
   * @returns the storage key
   */
  public async getStorageKey(): Promise<string> {
    const storageKey = await this.#createStorageKey();
    return storageKey;
  }

  /**
   * Utility to get the bearer token and storage key
   */
  async #getStorageKeyAndBearerToken() {
    const bearerToken = await this.#auth.getBearerToken();
    if (!bearerToken) {
      throw new Error('UserStorageController - unable to get bearer token');
    }
    const storageKey = await this.#createStorageKey();

    return { bearerToken, storageKey };
  }

  /**
   * Rather than storing the storage key, we can compute the storage key when needed.
   *
   * @returns the storage key
   */
  async #createStorageKey() {
    const id = await this.#auth.getSessionIdentifier();
    if (!id) {
      throw new Error('UserStorageController - unable to create storage key');
    }

    const storageKeySignature = await this.#snapSignMessage(`metamask:${id}`);
    const storageKey = createSHA256Hash(storageKeySignature);
    return storageKey;
  }

  /**
   * Signs a specific message using an underlying auth snap.
   *
   * @param message - A specific tagged message to sign.
   * @returns A Signature created by the snap.
   */
  #snapSignMessage(message: `metamask:${string}`): Promise<string> {
    return this.messagingSystem.call(
      'SnapController:handleRequest',
      createSnapSignMessageRequest(message),
    ) as Promise<string>;
  }
}
