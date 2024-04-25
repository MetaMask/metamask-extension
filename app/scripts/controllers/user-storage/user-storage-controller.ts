import {
  BaseController,
  RestrictedControllerMessenger,
  StateMetadata,
} from '@metamask/base-controller';
import { HandleSnapRequest } from '@metamask/snaps-controllers';
import {
  AuthenticationControllerGetBearerToken,
  AuthenticationControllerGetSessionProfile,
  AuthenticationControllerIsSignedIn,
  AuthenticationControllerPerformSignIn,
} from '../authentication/authentication-controller';
import { UserStorage } from '../profile-sync-sdk/user-storage';
import { Env } from '../profile-sync-sdk/env';
import { createSnapSignMessageRequest } from '../authentication/auth-snap-requests';
import { USER_STORAGE_ENTRIES, UserStorageEntryKeys } from './schema';

const controllerName = 'UserStorageController';

// State
export type UserStorageControllerState = {
  /**
   * Condition used by UI and to determine if we can use some of the User Storage methods.
   */
  isProfileSyncingEnabled: boolean;

  /**
   * Would be cool if storage was optional, since inside MM Wallet and Mobile we could generate the storage key on the fly.
   * Not a big deal.
   */
  storageKey?: string;
};
const defaultState: UserStorageControllerState = {
  isProfileSyncingEnabled: true,
};
const metadata: StateMetadata<UserStorageControllerState> = {
  isProfileSyncingEnabled: {
    persist: true,
    anonymous: true,
  },
  storageKey: {
    persist: false,
    anonymous: true,
  },
};

// Messenger Actions
type CreateActionsObj<T extends keyof UserStorageController> = {
  [K in T]: {
    type: `${typeof controllerName}:${K}`;
    handler: UserStorageController[K];
  };
};
type ActionsObj = CreateActionsObj<
  | 'performGetStorage'
  | 'performSetStorage'
  | 'getStorageKey'
  | 'enableProfileSyncing'
  | 'disableProfileSyncing'
>;
export type Actions = ActionsObj[keyof ActionsObj];
export type UserStorageControllerPerformGetStorage =
  ActionsObj['performGetStorage'];
export type UserStorageControllerPerformSetStorage =
  ActionsObj['performSetStorage'];
export type UserStorageControllerGetStorageKey = ActionsObj['getStorageKey'];
export type UserStorageControllerEnableProfileSyncing =
  ActionsObj['enableProfileSyncing'];
export type UserStorageControllerDisableProfileSyncing =
  ActionsObj['disableProfileSyncing'];

// Allowed Actions
export type AllowedActions =
  // Snap Requests
  | HandleSnapRequest
  // Auth Requests
  | AuthenticationControllerGetBearerToken
  | AuthenticationControllerGetSessionProfile
  | AuthenticationControllerPerformSignIn
  | AuthenticationControllerIsSignedIn;

// Messenger
export type UserStorageControllerMessenger = RestrictedControllerMessenger<
  typeof controllerName,
  Actions | AllowedActions,
  never,
  AllowedActions['type'],
  never
>;

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
  #auth = {
    getBearerToken: async () => {
      return await this.messagingSystem.call(
        'AuthenticationController:getBearerToken',
      );
    },
    getUserProfile: async () => {
      const sessionProfile = await this.messagingSystem.call(
        'AuthenticationController:getSessionProfile',
      );
      return sessionProfile;
    },
    isAuthEnabled: () => {
      return this.messagingSystem.call('AuthenticationController:isSignedIn');
    },
    signIn: async () => {
      return await this.messagingSystem.call(
        'AuthenticationController:performSignIn',
      );
    },
  };

  #userStorageSDK = new UserStorage(
    {
      env: Env.PRD,

      // See I would like this to be compatible/agnostic - not strictly tied to Auth SDK.
      // Instead we can pass in methods the SDK requires from auth...
      auth: {
        getAccessToken: async () => this.#auth.getBearerToken(),
        getUserProfile: async () => this.#auth.getUserProfile(),
        signMessage: (m) => this.#snapSignMessage(m),
      },
    },
    {
      storage: {
        getStorageKey: async () => this.state.storageKey ?? null,
        setStorageKey: async (newStorageKey) => {
          this.update((s) => {
            s.storageKey = newStorageKey;
          });
        },
      },
    },
  );

  constructor(params: {
    messenger: UserStorageControllerMessenger;
    state?: UserStorageControllerState;
  }) {
    super({
      messenger: params.messenger,
      metadata,
      name: controllerName,
      state: { ...defaultState, ...params.state },
    });

    this.#registerMessageHandlers();
  }

  /**
   * Constructor helper for registering this controller's messaging system
   * actions.
   */
  #registerMessageHandlers(): void {
    this.messagingSystem.registerActionHandler(
      'UserStorageController:performGetStorage',
      this.performGetStorage.bind(this),
    );

    this.messagingSystem.registerActionHandler(
      'UserStorageController:performSetStorage',
      this.performSetStorage.bind(this),
    );

    this.messagingSystem.registerActionHandler(
      'UserStorageController:getStorageKey',
      this.getStorageKey.bind(this),
    );

    this.messagingSystem.registerActionHandler(
      'UserStorageController:enableProfileSyncing',
      this.enableProfileSyncing.bind(this),
    );

    this.messagingSystem.registerActionHandler(
      'UserStorageController:disableProfileSyncing',
      this.disableProfileSyncing.bind(this),
    );
  }

  public async enableProfileSyncing(): Promise<void> {
    const isAlreadyEnabled = this.state.isProfileSyncingEnabled;
    if (isAlreadyEnabled) {
      return;
    }

    try {
      const authEnabled = this.#auth.isAuthEnabled();
      if (!authEnabled) {
        await this.#auth.signIn();
      }

      this.update((state) => {
        state.isProfileSyncingEnabled = true;
      });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : e;
      throw new Error(
        `${controllerName} - failed to enable profile syncing - ${errorMessage}`,
      );
    }
  }

  public async disableProfileSyncing(): Promise<void> {
    const isAlreadyDisabled = !this.state.isProfileSyncingEnabled;
    if (isAlreadyDisabled) {
      return;
    }

    this.update((state) => {
      state.isProfileSyncingEnabled = false;
    });
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
    this.#assertProfileSyncingEnabled();
    const entry = USER_STORAGE_ENTRIES[entryKey];

    const result = await this.#userStorageSDK.getItem(
      entry.path,
      entry.entryName,
    );

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
    this.#assertProfileSyncingEnabled();
    const entry = USER_STORAGE_ENTRIES[entryKey];

    await this.#userStorageSDK.setItem(entry.path, entry.entryName, value);
  }

  /**
   * Retrieves the storage key, for internal use only!
   *
   * @returns the storage key
   */
  public async getStorageKey(): Promise<string> {
    this.#assertProfileSyncingEnabled();

    // NOTE - I think it would be nicer if the SDK returns the storage key,
    // This way the client does not need to store the key and we can guarantee a valid storage key
    // Not a potentially stale key
    if (!this.state.storageKey) {
      throw new Error('No Storage Key Defined');
    }

    return this.state.storageKey;
  }

  #assertProfileSyncingEnabled(): void {
    if (!this.state.isProfileSyncingEnabled) {
      throw new Error(
        `${controllerName}: Unable to call method, user is not authenticated`,
      );
    }
  }

  /**
   * Signs a specific message using an underlying auth snap.
   *
   * @param message - A specific tagged message to sign.
   * @returns A Signature created by the snap.
   */
  #snapSignMessage(message: string): Promise<string> {
    return this.messagingSystem.call(
      'SnapController:handleRequest',
      createSnapSignMessageRequest(message),
    ) as Promise<string>;
  }
}
