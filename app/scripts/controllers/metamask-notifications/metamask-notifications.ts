import {
  BaseController,
  RestrictedControllerMessenger,
  ControllerGetStateAction,
  ControllerStateChangeEvent,
  StateMetadata,
} from '@metamask/base-controller';
import log from 'loglevel';
import type { InternalAccount } from '@metamask/keyring-api';
import type {
  AccountsControllerListAccountsAction,
  AccountsControllerSelectedAccountChangeEvent,
} from '@metamask/accounts-controller';
import { toChecksumHexAddress } from '@metamask/controller-utils';
import {
  AuthenticationControllerGetBearerToken,
  AuthenticationControllerIsSignedIn,
} from '../authentication/authentication-controller';
import {
  TRIGGER_TYPES,
  TRIGGER_TYPES_GROUPS,
} from './constants/notification-schema';
import { USER_STORAGE_VERSION_KEY } from './constants/constants';
import type {
  UserStorage,
  UserStorageEntryKeys,
} from './types/user-storage/user-storage';
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

// TODO - Mock Storage Controller Actions, added in a separate PR.
export type UserStorageControllerGetStorageKey = {
  type: 'UserStorageController:getStorageKey';
  handler: () => Promise<string>;
};
export type UserStorageControllerPerformGetStorage = {
  type: 'UserStorageController:performGetStorage';
  handler: (entryKey: UserStorageEntryKeys) => Promise<string | null>;
};
export type UserStorageControllerPerformSetStorage = {
  type: 'UserStorageController:performSetStorage';
  handler: (entryKey: UserStorageEntryKeys, value: string) => Promise<void>;
};

// TODO - Mock Push Notification Controller Actions, added in a separate PR.
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
  // Accounts Controller Requests
  | AccountsControllerListAccountsAction
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
export type AllowedEvents = AccountsControllerSelectedAccountChangeEvent;

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
 * Controller that updates the MetamaskNotifications and the ReadMetamaskNotifications list.
 * This controller subscribes to account state changes and ensures
 * that the account list is updated based on the latest account configurations.
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

  #accountsCache = new Set<string>();

  #accounts = {
    listAccounts: () => {
      // Fetch the list of accounts
      const accounts = this.messagingSystem.call(
        'AccountsController:listAccounts',
      ) as InternalAccount[];

      // Extract addresses and convert them to checksum addresses to ensure case sensitivity is not an issue
      const addresses = accounts.map((account) => {
        return toChecksumHexAddress(account.address as string);
      });

      this.#accountsCache = new Set([...this.#accountsCache, ...addresses]);
      return [...this.#accountsCache];
    },

    // This ensures that our cache is up-to-date when constructor is called.
    initialize: () => {
      this.#accounts.listAccounts();
    },

    // Subscription when an new account is changed
    // The initial cache should already have addresses already have in wallet,
    // so any new account switched to (that is not in cache) We can assume it is new.
    createNewNotificationsOnNewAccountChange: () => {
      this.messagingSystem.subscribe(
        'AccountsController:selectedAccountChange',
        async ({ address }: { address: string }) => {
          if (!this.state.isMetamaskNotificationsEnabled || !address) {
            return;
          }

          const checksumAddress = toChecksumHexAddress(address);
          if (this.#accountsCache.has(checksumAddress)) {
            return;
          }

          // An actual new address! We can create triggers/notifications for this.
          this.#accountsCache.add(checksumAddress);
          await this.updateOnChainTriggersByAccount(checksumAddress);
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
    // Call the constructor of BaseControllerV2
    super({
      messenger,
      metadata,
      name: controllerName,
      state: { ...defaultState, ...state },
    });

    this.#accounts.initialize();
    this.#accounts.createNewNotificationsOnNewAccountChange();
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
   * Verifies the presence of specified accounts and their chains in user storage.
   *
   * This method retrieves the user storage and uses `MetamaskNotificationsUtils` to check if the specified accounts and all their supported chains are present in the user storage.
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
   * Toggles the enabled state of metamask notifications.
   *
   * This method checks for the presence of a BearerToken token and a storage key before attempting to toggle the notification state.
   * If either the BearerToken token or the storage key is missing, the method disables metamask notifications and logs an error.
   * Otherwise, it toggles the current state of metamask notifications (enabled/disabled).
   *
   * @async
   * @throws {Error} If updating the state fails.
   */
  public async toggleMetamaskNotificationsEnabled() {
    try {
      this.#assertAuthEnabled();

      this.update((s) => {
        s.isMetamaskNotificationsEnabled = !s.isMetamaskNotificationsEnabled;
      });
    } catch (e) {
      log.error('Unable to toggle notifications', e);
    }
  }

  /**
   * Sets the `isMetamaskNotificationsFeatureSeen` state to true.
   *
   * This method ensures that the feature indicating whether the Metamask notifications
   * have been seen by the user is set to true. It checks for the presence of a BearerToken token
   * and a storage key before making the update. If either the BearerToken token or the storage key
   * is missing, it logs an error and throws an exception to indicate the failure.
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
    }
  }

  /**
   * Toggles the enabled state of feature announcements.
   *
   * This method checks for the presence of a BearerToken token and a storage key before attempting to toggle the state.
   * If either the BearerToken token or the storage key is missing, the method logs an error and throws an exception.
   * Otherwise, it toggles the current state of feature announcements (enabled/disabled).
   *
   * @async
   * @throws {Error} If the BearerToken token or storage key is missing.
   */
  public async toggleFeatureAnnouncementsEnabled() {
    try {
      this.#assertAuthEnabled();

      this.update((s) => {
        s.isFeatureAnnouncementsEnabled = !s.isFeatureAnnouncementsEnabled;
      });
    } catch (e) {
      log.error('Unable to toggle feature announcements', e);
    }
  }

  /**
   * Toggles the enabled state of Snap notifications.
   *
   * Similar to toggling feature announcements, this method verifies the presence of a BearerToken token and a storage key
   * before toggling the state of Snap notifications. If either is missing, an error is logged and an exception is thrown.
   * On successful verification, it toggles the enabled state of Snap notifications.
   *
   * @async
   * @throws {Error} If the BearerToken token or storage key is missing.
   */
  public async toggleSnapNotificationsEnabled() {
    try {
      this.#assertAuthEnabled();

      this.update((s) => {
        s.isSnapNotificationsEnabled = !s.isSnapNotificationsEnabled;
      });
    } catch (e) {
      log.error('Unable to toggle snap notifications', e);
    }
  }

  /**
   * This initializes on-chain triggers (used during sign in process)
   * This method checks for existing user storage and creates a new one if necessary.
   * It then proceeds to create on-chain triggers and updates the user storage accordingly.
   *
   * @returns The updated or newly created user storage.
   * @throws {Error} Throws an error if BearerToken or storage key is missing, or if the operation fails.
   */
  public async createOnChainTriggers(): Promise<UserStorage> {
    try {
      const { bearerToken, storageKey } =
        await this.#getValidStorageKeyAndBearerToken();
      const accounts = await this.#accounts.listAccounts();

      let userStorage = await this.#getUserStorage();

      // If userStorage does not exist, create a new one
      // All the triggers created are set
      // as not enabled
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

      // Write the new userStorage
      await this.#storage.setNotificationStorage(JSON.stringify(userStorage));

      return userStorage;
    } catch (err) {
      log.error('Failed to create OnChain triggers', err);
      throw new Error('Failed to create OnChain triggers');
    }
  }

  /**
   * Deletes on-chain triggers associated with a specific account.
   * This method performs several key operations:
   * 1. Validates the presence of a BearerToken token and a user storage key. If either is missing, an error is thrown.
   * 2. Retrieves and validates the user storage. If the user storage does not exist, an error is thrown.
   * 3. Identifies the UUIDs associated with the account to be deleted. If no UUIDs are found, the method returns early with a success message.
   * 4. Deletes the identified UUIDs from the on-chain triggers, effectively removing the triggers associated with the account.
   * 5. Updates the user storage to reflect the deletion of the triggers.
   *
   * @param account - The account for which on-chain triggers are to be deleted.
   * @returns A promise that resolves to void or an object containing a success message.
   * @throws An error if BearerToken or storage key is missing, if user storage does not exist, or if the deletion operation fails.
   */
  public async deleteOnChainTriggersByAccount(
    account: string,
  ): Promise<UserStorage> {
    try {
      // Get and Validate BearerToken and User Storage Key
      const { bearerToken, storageKey } =
        await this.#getValidStorageKeyAndBearerToken();

      // Get & Validate User Storage
      const userStorage = await this.#getUserStorage();
      this.#assertUserStorage(userStorage);

      // Get the UUIDs to delete
      const UUIDs = MetamaskNotificationsUtils.getUUIDsForAccount(
        userStorage,
        account,
      );
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
   * Deletes on-chain triggers based on the specified trigger type.
   * This method performs several key operations:
   * 1. Validates the presence of a BearerToken token and a user storage key. If either is missing, an error is thrown.
   * 2. Retrieves and validates the user storage. If the user storage does not exist, an error is thrown.
   * 3. Identifies the UUIDs associated with the specified trigger type. If no UUIDs are found, the method returns early with a success message.
   * 4. Deletes the identified UUIDs from the on-chain triggers, effectively removing the triggers associated with the specified trigger type.
   * 5. Updates the user storage to reflect the deletion of the triggers.
   *
   * @param triggerType - The type of trigger to delete.
   * @returns A promise that resolves to void or an object containing a success message.
   * @throws An error if BearerToken or storage key is missing, if user storage does not exist, or if the deletion operation fails.
   */
  public async deleteOnChainTriggersByTriggerType(
    triggerType: TRIGGER_TYPES,
  ): Promise<UserStorage> {
    try {
      // Get and Validate BearerToken and User Storage Key
      const { bearerToken, storageKey } =
        await this.#getValidStorageKeyAndBearerToken();

      // Get & Validate User Storage
      const userStorage = await this.#getUserStorage();
      this.#assertUserStorage(userStorage);

      // Get the UUIDs to delete
      const UUIDs = MetamaskNotificationsUtils.getUUIDsForKinds(userStorage, [
        triggerType,
      ]);
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
   * Updates on-chain triggers for a specific account.
   * This is for when we add a new account.
   *
   * This method performs several key operations:
   * 1. Validates the presence of a BearerToken token and a user storage key. If either is missing, an error is thrown.
   * 2. Retrieves and validates the current user storage. If the user storage does not exist, an error is thrown.
   * 3. Updates the user storage by upserting triggers related to the specified account.
   * 4. Validates the kinds of notifications that are enabled for the account.
   * 5. Creates on-chain triggers based on the allowed kinds of notifications.
   * 6. Updates the user storage with the new or modified triggers.
   * 7. (TODO) Updates push notifications triggers.
   *
   * @param account - The account for which on-chain triggers are to be updated.
   * @returns A promise that resolves to the updated user storage.
   * @throws An error if BearerToken or storage key is missing, if user storage does not exist, or if the operation fails.
   */
  public async updateOnChainTriggersByAccount(
    account: string,
  ): Promise<UserStorage> {
    try {
      // Get and Validate BearerToken and User Storage Key
      const { bearerToken, storageKey } =
        await this.#getValidStorageKeyAndBearerToken();

      // Get & Validate User Storage
      const userStorage = await this.#getUserStorage();
      this.#assertUserStorage(userStorage);

      // Check if the address has related UUIDs
      const updatedUserStorage =
        MetamaskNotificationsUtils.upsertAddressTriggers(account, userStorage);

      // Write te updated userStorage
      await this.#storage.setNotificationStorage(
        JSON.stringify(updatedUserStorage),
      );

      // Create the triggers
      const triggers = MetamaskNotificationsUtils.traverseUserStorageTriggers(
        updatedUserStorage,
        { address: account },
      );
      await OnChainNotifications.createOnChainTriggers(
        updatedUserStorage,
        storageKey,
        bearerToken,
        triggers,
      );

      // Update Push Notifications Triggers
      const UUIDs = MetamaskNotificationsUtils.getAllUUIDs(updatedUserStorage);
      await this.#pushNotifications.updatePushNotifications(UUIDs);

      // Update the userStorage
      await this.#storage.setNotificationStorage(
        JSON.stringify(updatedUserStorage),
      );

      return updatedUserStorage;
    } catch (err) {
      log.error('Failed to update OnChain triggers', err);
      throw new Error();
    }
  }

  /**
   * Updates on-chain triggers based on the specified trigger type.
   * This method performs several key operations:
   * 1. Validates the presence of a BearerToken token and a user storage key. If either is missing, an error is thrown.
   * 2. Retrieves and validates the current user storage. If the user storage does not exist, an error is thrown.
   * 3. Updates the user storage by upserting triggers related to the specified trigger type.
   * 4. Creates on-chain triggers based on the updated user storage.
   * 5. Updates the user storage with the new or modified triggers.
   * 6. (TODO) Updates push notifications triggers.
   *
   * @param triggerType - The type of trigger to update.
   * @returns A promise that resolves to the updated user storage.
   * @throws An error if BearerToken or storage key is missing, if user storage does not exist, or if the operation fails.
   */
  public async updateOnChainTriggersByType(
    triggerType: TRIGGER_TYPES,
  ): Promise<UserStorage> {
    try {
      // Get and Validate BearerToken and User Storage Key
      const { bearerToken, storageKey } =
        await this.#getValidStorageKeyAndBearerToken();

      // Get & Validate User Storage
      const userStorage = await this.#getUserStorage();
      this.#assertUserStorage(userStorage);

      // Check if the address has related UUIDs
      const updatedUserStorage =
        MetamaskNotificationsUtils.upsertTriggerTypeTriggers(
          triggerType,
          userStorage,
        );

      // Write te updated userStorage
      await this.#storage.setNotificationStorage(
        JSON.stringify(updatedUserStorage),
      );

      // Create the triggers
      const triggers =
        MetamaskNotificationsUtils.traverseUserStorageTriggers(
          updatedUserStorage,
        );
      await OnChainNotifications.createOnChainTriggers(
        updatedUserStorage,
        storageKey,
        bearerToken,
        triggers,
      );

      // Update Push Notifications Triggers
      const UUIDs = MetamaskNotificationsUtils.getAllUUIDs(updatedUserStorage);
      await this.#pushNotifications.updatePushNotifications(UUIDs);

      // Update the userStorage
      await this.#storage.setNotificationStorage(
        JSON.stringify(updatedUserStorage),
      );

      return updatedUserStorage;
    } catch (err) {
      log.error('Failed to update OnChain triggers', err);
      throw new Error();
    }
  }

  /**
   * Fetches and updates the list of metamask notifications.
   *
   * This method performs several key operations to update the metamask notifications:
   * 1. Validates the presence of a BearerToken token and a storage key. If either is missing, logs an error and throws an exception.
   * 2. Fetches raw feature announcement notifications regardless of the user's authentication status.
   * 3. If a BearerToken token and storage key are present, it attempts to fetch raw on-chain notifications.
   * 4. Processes both feature announcement and on-chain notifications, filtering out any undefined values.
   * 5. Sorts the combined list of notifications by their creation date in descending order.
   * 6. Updates the metamask notifications list with the processed notifications.
   *
   * If any errors occur during the process, it logs the error and throws an exception.
   *
   * @async
   * @throws {Error} If there's an issue fetching the notifications or if required credentials are missing.
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
   * This method processes a list of notifications, segregating them into on-chain and feature announcement notifications.
   * It then marks each notification as read by updating the relevant service or state. For on-chain notifications, it requires
   * a BearerToken token to proceed. If the BearerToken token is missing, an error is logged, and the process is halted. After successfully
   * marking the notifications as read, it updates the internal state to reflect these changes, ensuring the UI components
   * can accurately display read/unread notifications.
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
