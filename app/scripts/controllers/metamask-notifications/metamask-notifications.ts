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
};
export const defaultState: MetamaskNotificationsControllerState = {
  isMetamaskNotificationsFeatureSeen: false,
  isMetamaskNotificationsEnabled: false,
  isFeatureAnnouncementsEnabled: false,
  isSnapNotificationsEnabled: false,
  metamaskNotificationsList: [],
  metamaskNotificationsReadList: [],
};

// Mock Push Notification Controller Actions, added in a separate PR.
export type PushNotificationsControllerEnablePushNotifications = {
  type: 'PushPlatformNotificationsController:enablePushNotifications';
  handler: (UUIDs: string[]) => Promise<void>;
};
export type PushNotificationsControllerDisablePushNotifications = {
  type: 'PushPlatformNotificationsController:disablePushNotifications';
  handler: (UUIDs: string[]) => Promise<void>;
};
export type PushNotificationsControllerUpdateTriggerPushNotifications = {
  type: 'PushPlatformNotificationsController:updateTriggerPushNotifications';
  handler: (UUIDs: string[]) => Promise<void>;
};

// Messenger Actions
export type Actions = ControllerGetStateAction<
  'state',
  MetamaskNotificationsControllerState
>;

// Allowed Actions
export type AllowedActions =
  // Keyring Controller Requests
  | KeyringControllerGetAccountsAction
  // Auth Controller Requests
  | AuthenticationControllerGetBearerToken
  | AuthenticationControllerIsSignedIn
  // User Storage Controller Requests
  | UserStorageControllerGetStorageKey
  | UserStorageControllerPerformGetStorage
  | UserStorageControllerPerformSetStorage
  // Push Notifications Controller Requests
  | PushNotificationsControllerEnablePushNotifications
  | PushNotificationsControllerDisablePushNotifications
  | PushNotificationsControllerUpdateTriggerPushNotifications;

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

    this.#accounts.initialize();
    this.#accounts.subscribe();
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
      const { bearerToken, storageKey } =
        await this.#getValidStorageKeyAndBearerToken();
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
      this.setFeatureAnnouncementsEnabled(true);
      this.setMetamaskNotificationsEnabled(true);
      this.setSnapNotificationsEnabled(true);

      return userStorage;
    } catch (err) {
      log.error('Failed to create On Chain triggers', err);
      throw new Error('Failed to create On Chain triggers');
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

      return userStorage;
    } catch (err) {
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

      return userStorage;
    } catch (err) {
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
      // Raw Feature Notifications
      const rawFeatureAnnouncementNotifications =
        await FeatureNotifications.getFeatureAnnouncementNotifications().catch(
          () => [],
        );

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

      return metamaskNotifications;
    } catch (err) {
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
    });
  }
}
