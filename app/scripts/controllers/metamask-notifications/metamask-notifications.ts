import {
  BaseController,
  RestrictedControllerMessenger,
  ControllerGetStateAction,
  ControllerStateChangeEvent,
  StateMetadata,
} from '@metamask/base-controller';
import log from 'loglevel';
import { toChecksumHexAddress } from '@metamask/controller-utils';
import {
  KeyringControllerGetAccountsAction,
  KeyringControllerStateChangeEvent,
} from '@metamask/keyring-controller';
import {
  AuthenticationControllerGetBearerToken,
  AuthenticationControllerIsSignedIn,
} from '../authentication/authentication-controller';
import {
  PushPlatformNotificationsControllerEnablePushNotifications,
  PushPlatformNotificationsControllerDisablePushNotifications,
  PushPlatformNotificationsControllerUpdateTriggerPushNotifications,
} from '../push-platform-notifications/push-platform-notifications';
import {
  UserStorageControllerEnableProfileSyncing,
  UserStorageControllerGetStorageKey,
  UserStorageControllerPerformGetStorage,
  UserStorageControllerPerformSetStorage,
} from '../user-storage/user-storage-controller';
import {
  TRIGGER_TYPES,
  TRIGGER_TYPES_GROUPS,
} from './constants/notification-schema';
import { USER_STORAGE_VERSION_KEY } from './constants/constants';
import type { UserStorage } from './types/user-storage/user-storage';
import * as FeatureNotifications from './services/feature-announcements';
import * as OnChainNotifications from './services/onchain-notifications';
import type {
  Notification,
  MarkAsReadNotificationsParam,
} from './types/notification/notification';
import { OnChainRawNotification } from './types/on-chain-notification/on-chain-notification';
import { FeatureAnnouncementRawNotification } from './types/feature-announcement/feature-announcement';
import { processNotification } from './processors/process-notifications';
import * as MetamaskNotificationsUtils from './utils/utils';

// Unique name for the controller
const controllerName = 'MetamaskNotificationsController';

/**
 * State shape for MetamaskNotificationsController
 */
export type MetamaskNotificationsControllerState = {
  /**
   * Flag that indicates if the metamask notifications feature has been seen
   */
  isMetamaskNotificationsFeatureSeen: boolean;

  /**
   * Flag that indicates if the metamask notifications are enabled
   */
  isMetamaskNotificationsEnabled: boolean;

  /**
   * Flag that indicates if the feature announcements are enabled
   */
  isFeatureAnnouncementsEnabled: boolean;

  /**
   * Flag that indicates if the Snap notifications are enabled
   */
  isSnapNotificationsEnabled: boolean;

  /**
   * List of metamask notifications
   */
  metamaskNotificationsList: Notification[];

  /**
   * List of read metamask notifications
   */
  metamaskNotificationsReadList: string[];
  /**
   * Flag that indicates that the creating notifications is in progress
   */
  isCreatingMetamaskNotifications: boolean;
  /**
   * Flag that indicates that the fetching notifications is in progress
   * This is used to show a loading spinner in the UI
   * when fetching notifications
   */
  isFetchingMetamaskNotifications: boolean;
};

const metadata: StateMetadata<MetamaskNotificationsControllerState> = {
  isMetamaskNotificationsFeatureSeen: {
    persist: true,
    anonymous: false,
  },
  isMetamaskNotificationsEnabled: {
    persist: true,
    anonymous: false,
  },
  isFeatureAnnouncementsEnabled: {
    persist: true,
    anonymous: false,
  },
  isSnapNotificationsEnabled: {
    persist: true,
    anonymous: false,
  },
  metamaskNotificationsList: {
    persist: true,
    anonymous: true,
  },
  metamaskNotificationsReadList: {
    persist: true,
    anonymous: true,
  },
  isCreatingMetamaskNotifications: {
    persist: false,
    anonymous: false,
  },
  isFetchingMetamaskNotifications: {
    persist: false,
    anonymous: false,
  },
};
export const defaultState: MetamaskNotificationsControllerState = {
  isMetamaskNotificationsFeatureSeen: false,
  isMetamaskNotificationsEnabled: false,
  isFeatureAnnouncementsEnabled: false,
  isSnapNotificationsEnabled: false,
  metamaskNotificationsList: [],
  metamaskNotificationsReadList: [],
  isCreatingMetamaskNotifications: false,
  isFetchingMetamaskNotifications: false,
};

export declare type MetamaskNotificationsControllerUpdateMetamaskNotificationsList =
  {
    type: `${typeof controllerName}:updateMetamaskNotificationsList`;
    handler: MetamaskNotificationsController['updateMetamaskNotificationsList'];
  };

export declare type MetamaskNotificationsControllerDisableMetamaskNotifications =
  {
    type: `${typeof controllerName}:disableMetamaskNotifications`;
    handler: MetamaskNotificationsController['disableMetamaskNotifications'];
  };

export declare type MetamaskNotificationsControllerSelectIsMetamaskNotificationsEnabled =
  {
    type: `${typeof controllerName}:selectIsMetamaskNotificationsEnabled`;
    handler: MetamaskNotificationsController['selectIsMetamaskNotificationsEnabled'];
  };

// Messenger Actions
export type Actions =
  | MetamaskNotificationsControllerUpdateMetamaskNotificationsList
  | MetamaskNotificationsControllerDisableMetamaskNotifications
  | MetamaskNotificationsControllerSelectIsMetamaskNotificationsEnabled
  | ControllerGetStateAction<'state', MetamaskNotificationsControllerState>;

// Allowed Actions
export type AllowedActions =
  // Keyring Controller Requests
  | KeyringControllerGetAccountsAction
  // Auth Controller Requests
  | AuthenticationControllerGetBearerToken
  | AuthenticationControllerIsSignedIn
  // User Storage Controller Requests
  | UserStorageControllerEnableProfileSyncing
  | UserStorageControllerGetStorageKey
  | UserStorageControllerPerformGetStorage
  | UserStorageControllerPerformSetStorage
  // Push Notifications Controller Requests
  | PushPlatformNotificationsControllerEnablePushNotifications
  | PushPlatformNotificationsControllerDisablePushNotifications
  | PushPlatformNotificationsControllerUpdateTriggerPushNotifications;

// Events
export type MetamaskNotificationsControllerMessengerEvents =
  ControllerStateChangeEvent<
    typeof controllerName,
    MetamaskNotificationsControllerState
  >;

// Allowed Events
export type AllowedEvents = KeyringControllerStateChangeEvent;

// Type for the messenger of MetamaskNotificationsController
export type MetamaskNotificationsControllerMessenger =
  RestrictedControllerMessenger<
    typeof controllerName,
    Actions | AllowedActions,
    AllowedEvents,
    AllowedActions['type'],
    AllowedEvents['type']
  >;

/**
 * Controller that enables wallet notifications and feature announcements
 */
export class MetamaskNotificationsController extends BaseController<
  typeof controllerName,
  MetamaskNotificationsControllerState,
  MetamaskNotificationsControllerMessenger
> {
  #auth = {
    getBearerToken: async () => {
      return await this.messagingSystem.call(
        'AuthenticationController:getBearerToken',
      );
    },
    isSignedIn: () => {
      return this.messagingSystem.call('AuthenticationController:isSignedIn');
    },
  };

  #storage = {
    enableProfileSyncing: async () => {
      return await this.messagingSystem.call(
        'UserStorageController:enableProfileSyncing',
      );
    },
    getStorageKey: () => {
      return this.messagingSystem.call('UserStorageController:getStorageKey');
    },
    getNotificationStorage: async () => {
      return await this.messagingSystem.call(
        'UserStorageController:performGetStorage',
        'notification_settings',
      );
    },
    setNotificationStorage: async (state: string) => {
      return await this.messagingSystem.call(
        'UserStorageController:performSetStorage',
        'notification_settings',
        state,
      );
    },
  };

  #pushNotifications = {
    enablePushNotifications: async (UUIDs: string[]) => {
      return await this.messagingSystem.call(
        'PushPlatformNotificationsController:enablePushNotifications',
        UUIDs,
      );
    },
    disablePushNotifications: async (UUIDs: string[]) => {
      return await this.messagingSystem.call(
        'PushPlatformNotificationsController:disablePushNotifications',
        UUIDs,
      );
    },
    updatePushNotifications: async (UUIDs: string[]) => {
      return await this.messagingSystem.call(
        'PushPlatformNotificationsController:updateTriggerPushNotifications',
        UUIDs,
      );
    },
  };

  #prevAccountsSet = new Set<string>();

  #accounts = {
    /**
     * Used to get list of addresses from keyring (wallet addresses)
     *
     * @returns addresses removed, added, and latest list of addresses
     */
    listAccounts: async () => {
      const nonChecksumAccounts = await this.messagingSystem.call(
        'KeyringController:getAccounts',
      );
      const accounts = nonChecksumAccounts.map((a) => toChecksumHexAddress(a));
      const currentAccountsSet = new Set(accounts);

      const accountsAdded = accounts.filter(
        (a) => !this.#prevAccountsSet.has(a),
      );

      const accountsRemoved = [...this.#prevAccountsSet.values()].filter(
        (a) => !currentAccountsSet.has(a),
      );

      this.#prevAccountsSet = new Set(accounts);
      return {
        accountsAdded,
        accountsRemoved,
        accounts,
      };
    },

    /**
     * Initializes the cache/previous list. This is handy so we have an accurate in-mem state of the previous list of accounts.
     *
     * @returns result from list accounts
     */
    initialize: () => {
      return this.#accounts.listAccounts();
    },

    /**
     * Subscription to any state change in the keyring controller (aka wallet accounts).
     * We can call the `listAccounts` defined above to find out about any accounts added, removed
     * And call effects to subscribe/unsubscribe to notifications.
     */
    subscribe: () => {
      this.messagingSystem.subscribe(
        'KeyringController:stateChange',
        async () => {
          if (!this.state.isMetamaskNotificationsEnabled) {
            return;
          }

          const { accountsAdded, accountsRemoved } =
            await this.#accounts.listAccounts();

          const promises: Promise<unknown>[] = [];
          if (accountsAdded.length > 0) {
            promises.push(this.updateOnChainTriggersByAccount(accountsAdded));
          }
          if (accountsRemoved.length > 0) {
            promises.push(this.deleteOnChainTriggersByAccount(accountsRemoved));
          }
          await Promise.all(promises);
        },
      );
    },
  };

  /**
   * Creates a MetamaskNotificationsController instance.
   *
   * @param args - The arguments to this function.
   * @param args.messenger - Messenger used to communicate with BaseV2 controller.
   * @param args.state - Initial state to set on this controller.
   */
  constructor({
    messenger,
    state,
  }: {
    messenger: MetamaskNotificationsControllerMessenger;
    state?: MetamaskNotificationsControllerState;
  }) {
    super({
      messenger,
      metadata,
      name: controllerName,
      state: { ...defaultState, ...state },
    });

    this.#registerMessageHandlers();
    this.#accounts.initialize();
    this.#accounts.subscribe();
  }

  #registerMessageHandlers(): void {
    this.messagingSystem.registerActionHandler(
      `${controllerName}:updateMetamaskNotificationsList`,
      this.updateMetamaskNotificationsList.bind(this),
    );

    this.messagingSystem.registerActionHandler(
      `${controllerName}:disableMetamaskNotifications`,
      this.disableMetamaskNotifications.bind(this),
    );

    this.messagingSystem.registerActionHandler(
      `${controllerName}:selectIsMetamaskNotificationsEnabled`,
      this.selectIsMetamaskNotificationsEnabled.bind(this),
    );
  }

  #assertAuthEnabled() {
    if (!this.#auth.isSignedIn()) {
      this.update((s) => {
        s.isMetamaskNotificationsEnabled = false;
      });
      throw new Error('User is not signed in.');
    }
  }

  async #getValidStorageKeyAndBearerToken() {
    this.#assertAuthEnabled();

    const bearerToken = await this.#auth.getBearerToken();
    const storageKey = await this.#storage.getStorageKey();

    if (!bearerToken || !storageKey) {
      throw new Error('Missing BearerToken or storage key');
    }

    return { bearerToken, storageKey };
  }

  #performEnableProfileSyncing = async () => {
    try {
      await this.#storage.enableProfileSyncing();
    } catch (e) {
      log.error('Failed to enable profile syncing', e);
      throw new Error('Failed to enable profile syncing');
    }
  };

  #assertUserStorage(
    storage: UserStorage | null,
  ): asserts storage is UserStorage {
    if (!storage) {
      throw new Error('User Storage does not exist');
    }
  }

  /**
   * Retrieves and parses the user storage from the storage key.
   *
   * This method attempts to retrieve the user storage using the specified storage key,
   * then parses the JSON string to an object. If the storage is not found or cannot be parsed,
   * it throws an error.
   *
   * @returns The parsed user storage object or null
   */
  async #getUserStorage(): Promise<UserStorage | null> {
    const userStorageString: string | null =
      await this.#storage.getNotificationStorage();

    if (!userStorageString) {
      return null;
    }

    try {
      const userStorage: UserStorage = JSON.parse(userStorageString);
      return userStorage;
    } catch (error) {
      log.error('Unable to parse User Storage');
      return null;
    }
  }

  /**
   * @deprecated - This needs rework for it to be feasible. Currently this is a half-baked solution, as it fails once we add new triggers (introspection for filters is difficult).
   *
   * Checks for the complete presence of trigger types by group across all addresses in user storage.
   *
   * This method retrieves the user storage and uses `MetamaskNotificationsUtils` to verify if all expected trigger types for each group are present for every address.
   * @returns A record indicating whether all expected trigger types for each group are present for every address.
   * @throws {Error} If user storage does not exist.
   */
  public async checkTriggersPresenceByGroup(): Promise<
    Record<TRIGGER_TYPES_GROUPS, boolean>
  > {
    const userStorage = await this.#getUserStorage();
    this.#assertUserStorage(userStorage);

    // Use MetamaskNotificationsUtils to check the presence of triggers
    return MetamaskNotificationsUtils.checkTriggersPresenceByGroup(userStorage);
  }

  /**
   * Retrieves the current enabled state of MetaMask notifications.
   *
   * This method directly returns the boolean value of `isMetamaskNotificationsEnabled`
   * from the controller's state, indicating whether MetaMask notifications are currently enabled.
   *
   * @returns The enabled state of MetaMask notifications.
   */
  public selectIsMetamaskNotificationsEnabled(): boolean {
    return this.state.isMetamaskNotificationsEnabled;
  }

  /**
   * Updates the list of MetaMask notifications by adding a new notification at the beginning of the list.
   * This method ensures that the most recent notification is displayed first in the UI.
   *
   * @param notification - The new notification object to be added to the list.
   * @returns A promise that resolves when the notification list has been successfully updated.
   */
  public async updateMetamaskNotificationsList(
    notification: Notification,
  ): Promise<void> {
    const isNotUndefined = <T>(t?: T): t is T => Boolean(t);
    const processAndFilterSingle = (
      n: FeatureAnnouncementRawNotification | OnChainRawNotification,
    ) => {
      try {
        const processedNotification = processNotification(n);
        if (isNotUndefined(processedNotification)) {
          return processedNotification;
        }
      } catch {
        return undefined;
      }
      return undefined;
    };

    const processedNotification = processAndFilterSingle(notification);

    if (processedNotification) {
      this.update((s) => {
        s.metamaskNotificationsList = [
          notification,
          ...s.metamaskNotificationsList,
        ];
      });
    }
  }

  /**
   * Sets the state of notification creation process.
   *
   * This method updates the `isCreatingMetamaskNotifications` state, which can be used to indicate
   * whether the notification creation process is currently active or not. This is useful
   * for UI elements that need to reflect the state of ongoing operations, such as loading
   * indicators or disabled buttons during processing.
   *
   * @param isCreatingMetamaskNotifications - A boolean value representing the new state of the notification creation process.
   */
  #setIsCreatingMetamaskNotifications(
    isCreatingMetamaskNotifications: boolean,
  ) {
    this.update((s) => {
      s.isCreatingMetamaskNotifications = isCreatingMetamaskNotifications;
    });
  }

  #setIsFetchingMetamaskNotifications(
    isFetchingMetamaskNotifications: boolean,
  ) {
    this.update((s) => {
      s.isFetchingMetamaskNotifications = isFetchingMetamaskNotifications;
    });
  }

  /**
   * Returns if an account or multiple accounts are present in User Storage.
   * This is to ensure we show the correct UI in the notification settings page,
   * on which notifications are enabled or disabled.
   *
   * **Action** - If an account is enabled or disabled
   *
   * @param accounts - An array of account addresses to be checked for presence.
   * @returns A record where each key is an account address and each value is a boolean indicating whether the account and all its supported chains are present in the user storage.
   * @throws {Error} If user storage does not exist.
   */
  public async checkAccountsPresence(
    accounts: string[],
  ): Promise<Record<string, boolean>> {
    // Retrieve user storage
    const userStorage = await this.#getUserStorage();
    this.#assertUserStorage(userStorage);

    // Use MetamaskNotificationsUtils to check the presence of accounts
    return MetamaskNotificationsUtils.checkAccountsPresence(
      userStorage,
      accounts,
    );
  }

  /**
   * Sets the enabled state of MetaMask notifications.
   * This method first checks if the user is authenticated before attempting to toggle the notification settings.
   *
   * **Action** - This method is used to enable or disable MetaMask notifications based on the provided state.
   *
   * @param state - A boolean value indicating the desired enabled state of the notifications.
   * @async
   * @throws {Error} If the user is not authenticated or if there is an error updating the state.
   */
  public async setMetamaskNotificationsEnabled(state: boolean) {
    try {
      this.#assertAuthEnabled();

      this.update((s) => {
        s.isMetamaskNotificationsEnabled = state;
      });
    } catch (e) {
      log.error('Unable to toggle notifications', e);
      throw new Error('Unable to toggle notifications');
    }
  }

  /**
   * This is for a 1-time flag/CTA for notifications. When dismissed we will invoke this.
   *
   * **Action** - use to dismiss the Notification CTA in the UI
   *
   * @async
   * @throws {Error} Throws an error if the BearerToken token or storage key is missing.
   */
  public async setMetamaskNotificationsFeatureSeen() {
    try {
      this.#assertAuthEnabled();

      this.update((s) => {
        s.isMetamaskNotificationsFeatureSeen = true;
      });
    } catch (e) {
      log.error('Unable to declare feature/CTA was seen', e);
      throw new Error('Unable to declare feature/CTA was seen');
    }
  }

  /**
   * Sets the enabled state of feature announcements.
   *
   * **Action** - used in the notification settings to enable/disable feature announcements.
   *
   * @param state - A boolean value indicating the desired enabled state of the feature announcements.
   * @async
   * @throws {Error} If the BearerToken token or storage key is missing.
   */
  public async setFeatureAnnouncementsEnabled(state: boolean) {
    try {
      this.#assertAuthEnabled();

      this.update((s) => {
        s.isFeatureAnnouncementsEnabled = state;
      });
    } catch (e) {
      log.error('Unable to toggle feature announcements', e);
      throw new Error('Unable to toggle feature announcements');
    }
  }

  /**
   * Sets the enabled state of Snap notifications.
   *
   * **Action** - used in the notifications settings page to enable/disable snap notifications.
   *
   * @param state - A boolean value indicating the desired enabled state of the snap notifications.
   * @async
   * @throws {Error} If the BearerToken token or storage key is missing.
   */
  public async setSnapNotificationsEnabled(state: boolean) {
    try {
      this.#assertAuthEnabled();

      this.update((s) => {
        s.isSnapNotificationsEnabled = state;
      });
    } catch (e) {
      log.error('Unable to toggle snap notifications', e);
    }
  }

  /**
   * This creates/re-creates on-chain triggers defined in User Storage.
   *
   * **Action** - Used during Sign In / Enabling of notifications.
   *
   * @returns The updated or newly created user storage.
   * @throws {Error} Throws an error if unauthenticated or from other operations.
   */
  public async createOnChainTriggers(): Promise<UserStorage> {
    try {
      await this.#performEnableProfileSyncing();

      const { bearerToken, storageKey } =
        await this.#getValidStorageKeyAndBearerToken();

      this.#setIsCreatingMetamaskNotifications(true);

      const { accounts } = await this.#accounts.listAccounts();

      let userStorage = await this.#getUserStorage();

      // If userStorage does not exist, create a new one
      // All the triggers created are set as: "disabled"
      if (userStorage?.[USER_STORAGE_VERSION_KEY] === undefined) {
        userStorage = MetamaskNotificationsUtils.initializeUserStorage(
          accounts.map((account) => ({ address: account })),
          false,
        );

        // Write the userStorage
        await this.#storage.setNotificationStorage(JSON.stringify(userStorage));
      }

      // Create the triggers
      const triggers =
        MetamaskNotificationsUtils.traverseUserStorageTriggers(userStorage);
      await OnChainNotifications.createOnChainTriggers(
        userStorage,
        storageKey,
        bearerToken,
        triggers,
      );

      // Create push notifications triggers
      const allUUIDS = MetamaskNotificationsUtils.getAllUUIDs(userStorage);
      await this.#pushNotifications.enablePushNotifications(allUUIDS);

      // Write the new userStorage (triggers are now "enabled")
      await this.#storage.setNotificationStorage(JSON.stringify(userStorage));

      // Update the state of the controller
      this.setMetamaskNotificationsFeatureSeen();
      this.setFeatureAnnouncementsEnabled(true);
      this.setSnapNotificationsEnabled(true);
      this.setMetamaskNotificationsEnabled(true);
      this.#setIsCreatingMetamaskNotifications(false);

      return userStorage;
    } catch (err) {
      this.#setIsCreatingMetamaskNotifications(false);
      log.error('Failed to create On Chain triggers', err);
      throw new Error('Failed to create On Chain triggers');
    }
  }

  /**
   * Enables all MetaMask notifications for the user.
   * This method performs several key operations:
   * 1. Validates the storage key and bearer token necessary for authentication.
   * 2. Retrieves all linked accounts.
   * 3. Ensures profile syncing is enabled if the storage key is missing.
   * 4. Enables on-chain triggers for each account.
   * 5. Sets the global notification settings for MetaMask, feature announcements, and Snap notifications to true.
   *
   * @throws {Error} If there is an error during the process of enabling notifications.
   */
  public async enableMetamaskNotifications() {
    try {
      await this.#performEnableProfileSyncing();

      this.#setIsCreatingMetamaskNotifications(true);

      const { accounts } = await this.#accounts.listAccounts();

      // For each account enable the triggers
      await this.updateOnChainTriggersByAccount(accounts);

      // Set the states
      this.setMetamaskNotificationsEnabled(true);
      this.setFeatureAnnouncementsEnabled(true);
      this.setSnapNotificationsEnabled(true);
      this.#setIsCreatingMetamaskNotifications(false);
    } catch (e) {
      this.#setIsCreatingMetamaskNotifications(false);
      log.error('Unable to enable notifications', e);
      throw new Error('Unable to enable notifications');
    }
  }

  /**
   * Disables all MetaMask notifications for the user.
   * This method ensures that the user is authenticated, retrieves all linked accounts,
   * and disables on-chain triggers for each account. It also sets the global notification
   * settings for MetaMask, feature announcements, and Snap notifications to false.
   *
   * @throws {Error} If the user is not authenticated or if there is an error during the process.
   */
  public async disableMetamaskNotifications() {
    try {
      this.#assertAuthEnabled();
      this.#setIsCreatingMetamaskNotifications(true);

      const { accounts } = await this.#accounts.listAccounts();

      // For each account disable the triggers
      await this.deleteOnChainTriggersByAccount(accounts);

      // Set the states
      this.setMetamaskNotificationsEnabled(false);
      this.setFeatureAnnouncementsEnabled(false);
      this.setSnapNotificationsEnabled(false);

      // Empty the notifications list
      this.update((s) => {
        s.metamaskNotificationsList = [];
      });
      this.#setIsCreatingMetamaskNotifications(false);
    } catch (e) {
      this.#setIsCreatingMetamaskNotifications(false);
      log.error('Unable to disable notifications', e);
      throw new Error('Unable to disable notifications');
    }
  }

  /**
   * Deletes on-chain triggers associated with a specific account.
   * This method performs several key operations:
   * 1. Validates Auth & Storage
   * 2. Finds and deletes all triggers associated with the account
   * 3. Disables any related push notifications
   * 4. Updates Storage to reflect new state.
   *
   * **Action** - When a user disables notifications for a given account in settings.
   *
   * @param accounts - The account for which on-chain triggers are to be deleted.
   * @returns A promise that resolves to void or an object containing a success message.
   * @throws {Error} Throws an error if unauthenticated or from other operations.
   */
  public async deleteOnChainTriggersByAccount(
    accounts: string[],
  ): Promise<UserStorage> {
    try {
      this.#setIsCreatingMetamaskNotifications(true);
      // Get and Validate BearerToken and User Storage Key
      const { bearerToken, storageKey } =
        await this.#getValidStorageKeyAndBearerToken();

      // Get & Validate User Storage
      const userStorage = await this.#getUserStorage();
      this.#assertUserStorage(userStorage);

      // Get the UUIDs to delete
      const UUIDs = accounts
        .map((a) =>
          MetamaskNotificationsUtils.getUUIDsForAccount(
            userStorage,
            a.toLowerCase(),
          ),
        )
        .flat();

      if (UUIDs.length === 0) {
        return userStorage;
      }

      // Delete these UUIDs (Mutates User Storage)
      await OnChainNotifications.deleteOnChainTriggers(
        userStorage,
        storageKey,
        bearerToken,
        UUIDs,
      );

      // Delete these UUIDs from the push notifications
      await this.#pushNotifications.disablePushNotifications(UUIDs);

      // Update User Storage
      await this.#storage.setNotificationStorage(JSON.stringify(userStorage));
      this.#setIsCreatingMetamaskNotifications(false);

      return userStorage;
    } catch (err) {
      this.#setIsCreatingMetamaskNotifications(false);
      log.error('Failed to delete OnChain triggers', err);
      throw new Error('Failed to delete OnChain triggers');
    }
  }

  /**
   * Updates/Creates on-chain triggers for a specific account.
   *
   * This method performs several key operations:
   * 1. Validates Auth & Storage
   * 2. Finds and creates any missing triggers associated with the account
   * 3. Enables any related push notifications
   * 4. Updates Storage to reflect new state.
   *
   * **Action** - When a user enables notifications for an account
   *
   * @param accounts - List of accounts you want to update.
   * @returns A promise that resolves to the updated user storage.
   * @throws {Error} Throws an error if unauthenticated or from other operations.
   */
  public async updateOnChainTriggersByAccount(
    accounts: string[],
  ): Promise<UserStorage> {
    try {
      this.#setIsCreatingMetamaskNotifications(true);
      // Get and Validate BearerToken and User Storage Key
      const { bearerToken, storageKey } =
        await this.#getValidStorageKeyAndBearerToken();

      // Get & Validate User Storage
      const userStorage = await this.#getUserStorage();
      this.#assertUserStorage(userStorage);

      // Add any missing triggers
      accounts.forEach((a) =>
        MetamaskNotificationsUtils.upsertAddressTriggers(a, userStorage),
      );

      // Write te updated userStorage (where triggers are disabled)
      await this.#storage.setNotificationStorage(JSON.stringify(userStorage));

      // Create the triggers
      const triggers = MetamaskNotificationsUtils.traverseUserStorageTriggers(
        userStorage,
        {
          mapTrigger: (t) => {
            if (
              accounts.some((a) => a.toLowerCase() === t.address.toLowerCase())
            ) {
              return t;
            }
            return undefined;
          },
        },
      );
      await OnChainNotifications.createOnChainTriggers(
        userStorage,
        storageKey,
        bearerToken,
        triggers,
      );

      // Update Push Notifications Triggers
      const UUIDs = MetamaskNotificationsUtils.getAllUUIDs(userStorage);
      await this.#pushNotifications.updatePushNotifications(UUIDs);

      // Update the userStorage (where triggers are enabled)
      await this.#storage.setNotificationStorage(JSON.stringify(userStorage));
      this.#setIsCreatingMetamaskNotifications(false);

      return userStorage;
    } catch (err) {
      this.#setIsCreatingMetamaskNotifications(false);
      log.error('Failed to update OnChain triggers', err);
      throw new Error('Failed to update OnChain triggers');
    }
  }

  /**
   * Fetches the list of metamask notifications.
   * This includes OnChain notifications and Feature Announcements.
   *
   * **Action** - When a user views the notification list page/dropdown
   *
   * @throws {Error} Throws an error if unauthenticated or from other operations.
   */
  public async fetchAndUpdateMetamaskNotifications(): Promise<Notification[]> {
    try {
      this.#setIsFetchingMetamaskNotifications(true);

      // Raw Feature Notifications
      const rawFeatureAnnouncementNotifications = this.state
        .isFeatureAnnouncementsEnabled
        ? await FeatureNotifications.getFeatureAnnouncementNotifications().catch(
            () => [],
          )
        : [];

      // Raw On Chain Notifications
      const rawOnChainNotifications: OnChainRawNotification[] = [];
      const userStorage = await this.#storage
        .getNotificationStorage()
        .then((s) => s && (JSON.parse(s) as UserStorage))
        .catch(() => null);
      const bearerToken = await this.#auth.getBearerToken().catch(() => null);
      if (userStorage && bearerToken) {
        const notifications =
          await OnChainNotifications.getOnChainNotifications(
            userStorage,
            bearerToken,
          ).catch(() => []);

        rawOnChainNotifications.push(...notifications);
      }

      const readIds = this.state.metamaskNotificationsReadList;

      // For each rawOnChainNotifications check if the notification unread is false
      // update the state metamaskNotificationsReadList removing the id from the list
      rawOnChainNotifications.forEach(
        (notification: OnChainRawNotification) => {
          if (notification.unread === false) {
            this.update((s) => {
              s.metamaskNotificationsReadList =
                s.metamaskNotificationsReadList.filter(
                  (id) => id !== notification.id,
                );
            });
          }
        },
      );

      // Combined Notifications
      const isNotUndefined = <T>(t?: T): t is T => Boolean(t);
      const processAndFilter = (
        ns: (FeatureAnnouncementRawNotification | OnChainRawNotification)[],
      ) =>
        ns
          .map((n) => {
            try {
              return processNotification(n, readIds);
            } catch {
              // So we don't throw and show no notifications
              return undefined;
            }
          })
          .filter(isNotUndefined);

      const featureAnnouncementNotifications = processAndFilter(
        rawFeatureAnnouncementNotifications,
      );
      const onChainNotifications = processAndFilter(rawOnChainNotifications);

      const metamaskNotifications: Notification[] = [
        ...featureAnnouncementNotifications,
        ...onChainNotifications,
      ];
      metamaskNotifications.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      // Update State
      this.update((s) => {
        s.metamaskNotificationsList = metamaskNotifications;
      });

      this.#setIsFetchingMetamaskNotifications(false);
      return metamaskNotifications;
    } catch (err) {
      this.#setIsFetchingMetamaskNotifications(false);
      log.error('Failed to fetch notifications', err);
      throw new Error('Failed to fetch notifications');
    }
  }

  /**
   * Marks specified metamask notifications as read.
   *
   * @param notifications - An array of notifications to be marked as read. Each notification should include its type and read status.
   * @returns A promise that resolves when the operation is complete.
   */
  public async markMetamaskNotificationsAsRead(
    notifications: MarkAsReadNotificationsParam,
  ): Promise<void> {
    let onchainNotificationIds: string[] = [];
    let featureAnnouncementNotificationIds: string[] = [];

    try {
      // Filter unread on/off chain notifications
      const onChainNotifications = notifications.filter(
        (notification) =>
          notification.type !== TRIGGER_TYPES.FEATURES_ANNOUNCEMENT &&
          !notification.isRead,
      );

      const featureAnnouncementNotifications = notifications.filter(
        (notification) =>
          notification.type === TRIGGER_TYPES.FEATURES_ANNOUNCEMENT &&
          !notification.isRead,
      );

      // Mark On-Chain Notifications as Read
      if (onChainNotifications.length > 0) {
        const bearerToken = await this.#auth.getBearerToken();

        if (bearerToken) {
          onchainNotificationIds = onChainNotifications.map(
            (notification) => notification.id,
          );
          await OnChainNotifications.markNotificationsAsRead(
            bearerToken,
            onchainNotificationIds,
          ).catch(() => {
            onchainNotificationIds = [];
            log.warn('Unable to mark onchain notifications as read');
          });
        }
      }

      // Mark Off-Chain notifications as Read
      if (featureAnnouncementNotifications.length > 0) {
        featureAnnouncementNotificationIds =
          featureAnnouncementNotifications.map(
            (notification) => notification.id,
          );
      }
    } catch (err) {
      log.warn('Something failed when marking notifications as read', err);
    }

    // Update the state (state is also used on counter & badge)
    this.update((s) => {
      const currentReadList = s.metamaskNotificationsReadList;
      const newReadIds = [
        ...onchainNotificationIds,
        ...featureAnnouncementNotificationIds,
      ];
      s.metamaskNotificationsReadList = [
        ...new Set([...currentReadList, ...newReadIds]),
      ];

      s.metamaskNotificationsList = s.metamaskNotificationsList.map(
        (notification: Notification) => {
          if (newReadIds.includes(notification.id)) {
            return { ...notification, isRead: true };
          }
          return notification;
        },
      );
    });
  }
}
