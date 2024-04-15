import {
  BaseController,
  RestrictedControllerMessenger,
  ControllerGetStateAction,
  ControllerStateChangeEvent,
} from '@metamask/base-controller';
import log from 'loglevel';
import type { InternalAccount } from '@metamask/keyring-api';
import type {
  AccountsControllerListAccountsAction,
  AccountsControllerSelectedAccountChangeEvent,
} from '@metamask/accounts-controller';
import { toChecksumHexAddress } from '@metamask/controller-utils';
import {
  TRIGGER_TYPES,
  TRIGGER_TYPES_GROUPS,
} from './constants/notification-schema';
import { USER_STORAGE_VERSION_KEY } from './constants/constants';
import type {
  UserStorage,
  UserStorageEntryKeys,
} from './types/user-storage/user-storage';
import { FeatureAnnouncementsService } from './services/feature-announcements';
import { OnChainNotificationsService } from './services/onchain-notifications';
import type {
  Notification,
  MarkAsReadNotificationsParam,
} from './types/notification/notification';
import { OnChainRawNotification } from './types/on-chain-notification/on-chain-notification';
import { FeatureAnnouncementRawNotification } from './types/feature-announcement/feature-announcement';
import { processNotification } from './processors/process-notifications';
import { MetamaskNotificationsUtils } from './utils/utils';

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
   * List of unread metamask notifications
   */
  metamaskNotificationsUnreadList: string[];

  /**
   * List of addresses to be used to create the onChain triggers
   */
  metamaskNotificationsAddressRegistry: string[];
};

// Describes the action for updating the accounts list
export type MetamaskNotificationsControllerUpdateNotificationsListAction = {
  type: `${typeof controllerName}:updateMetamaskNotificationsList`;
  handler: MetamaskNotificationsController['updateMetamaskNotificationsList'];
};

// Union of all possible actions for the messenger
export type MetamaskNotificationsControllerMessengerActions =
  | MetamaskNotificationsControllerUpdateNotificationsListAction
  | ControllerGetStateAction<'state', MetamaskNotificationsControllerState>;

type AllowedActions = AccountsControllerListAccountsAction;

export type MetamaskNotificationsControllerMessengerEvents =
  ControllerStateChangeEvent<
    typeof controllerName,
    MetamaskNotificationsControllerState
  >;

type AllowedEvents = AccountsControllerSelectedAccountChangeEvent;

// Type for the messenger of MetamaskNotificationsController
export type MetamaskNotificationsControllerMessenger =
  RestrictedControllerMessenger<
    typeof controllerName,
    MetamaskNotificationsControllerMessengerActions | AllowedActions,
    AllowedEvents,
    AllowedActions['type'],
    AllowedEvents['type']
  >;

// Metadata for the controller state
const metadata = {
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
  metamaskNotificationsUnreadList: {
    persist: true,
    anonymous: true,
  },
  metamaskNotificationsAddressRegistry: {
    persist: true,
    anonymous: true,
  },
};

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
  private featureAnnouncementsService: FeatureAnnouncementsService;

  private onChainNotificationsService: OnChainNotificationsService;

  private metamaskNotificationUtils: MetamaskNotificationsUtils;

  private isSignedIn: () => boolean;

  private getBearerToken: () => string;

  private getStorageKey: () => string;

  private getStorage: (
    entryKey: UserStorageEntryKeys,
  ) => Promise<string | null>;

  private setStorage: (
    entryKey: UserStorageEntryKeys,
    value: string,
  ) => Promise<void>;

  private enablePushNotifications: (UUIDs: string[]) => Promise<void>;

  private disablePushNotifications: (UUIDs: string[]) => Promise<void>;

  private updatePushNotifications: (UUIDs: string[]) => Promise<void>;

  private accounts: InternalAccount[];

  /**
   * Creates a MetamaskNotificationsController instance.
   *
   * @param args - The arguments to this function.
   * @param args.messenger - Messenger used to communicate with BaseV2 controller.
   * @param args.state - Initial state to set on this controller.
   * @param args.isSignedIn - Function to check if the user is signed in.
   * @param args.getBearerToken - Function that returns the jet token for this controller.
   * @param args.getStorageKey - Function that returns the storage key for this controller.
   * @param args.getStorage - Function to retrieve user storage data.
   * @param args.setStorage - Function to update user storage data.
   * @param args.enablePushNotifications - Function to enable push notifications for specific UUIDs.
   * @param args.disablePushNotifications - Function to disable push notifications for specific UUIDs.
   * @param args.updatePushNotifications - Function to update push notifications settings.
   */
  constructor({
    messenger,
    state,
    isSignedIn,
    getBearerToken,
    getStorageKey,
    getStorage,
    setStorage,
    enablePushNotifications,
    disablePushNotifications,
    updatePushNotifications,
  }: {
    messenger: MetamaskNotificationsControllerMessenger;
    state?: MetamaskNotificationsControllerState;
    isSignedIn: () => boolean;
    getBearerToken: () => string;
    getStorageKey: () => string;
    getStorage: (entryKey: UserStorageEntryKeys) => Promise<string | null>;
    setStorage: (
      entryKey: UserStorageEntryKeys,
      value: string,
    ) => Promise<void>;
    enablePushNotifications: (UUIDs: string[]) => Promise<void>;
    disablePushNotifications: (UUIDs: string[]) => Promise<void>;
    updatePushNotifications: (UUIDs: string[]) => Promise<void>;
  }) {
    const isMetamaskNotificationsFeatureSeen =
      state?.isMetamaskNotificationsFeatureSeen || false;
    const isMetamaskNotificationsEnabled =
      state?.isMetamaskNotificationsEnabled || false;
    const isFeatureAnnouncementsEnabled =
      state?.isFeatureAnnouncementsEnabled || false;
    const isSnapNotificationsEnabled =
      state?.isSnapNotificationsEnabled || false;
    const metamaskNotificationsList = state?.metamaskNotificationsList || [];
    const metamaskNotificationsReadList =
      state?.metamaskNotificationsReadList || [];
    const metamaskNotificationsUnreadList =
      state?.metamaskNotificationsUnreadList || [];
    const metamaskNotificationsAddressRegistry =
      state?.metamaskNotificationsAddressRegistry || [];

    // Call the constructor of BaseControllerV2
    super({
      messenger,
      metadata,
      name: controllerName,
      state: {
        isMetamaskNotificationsFeatureSeen,
        isMetamaskNotificationsEnabled,
        isFeatureAnnouncementsEnabled,
        isSnapNotificationsEnabled,
        metamaskNotificationsList,
        metamaskNotificationsReadList,
        metamaskNotificationsUnreadList,
        metamaskNotificationsAddressRegistry,
      },
    });

    this.featureAnnouncementsService = new FeatureAnnouncementsService();
    this.onChainNotificationsService = new OnChainNotificationsService();

    this.metamaskNotificationUtils = new MetamaskNotificationsUtils();

    this.accounts = this.messagingSystem.call(
      'AccountsController:listAccounts',
    ) as InternalAccount[];
    this.isSignedIn = isSignedIn;

    this.getBearerToken = getBearerToken;

    this.getStorageKey = getStorageKey;

    this.getStorage = getStorage;

    this.setStorage = setStorage;

    this.enablePushNotifications = enablePushNotifications;

    this.disablePushNotifications = disablePushNotifications;

    this.updatePushNotifications = updatePushNotifications;

    this.inizializeAddressRegistry();

    /**
     * Subscribes to account selection changes to update on-chain triggers and the address registry.
     *
     * This method listens for changes in the selected account from the AccountsController.
     * When an account change is detected, it performs the following actions:
     * 1. Converts the account address to a checksum address for consistency.
     * 2. Checks if the checksum address is already present in the `metamaskNotificationsAddressRegistry`.
     * - If it is, the function exits early to avoid unnecessary updates.
     * 3. If the address is not in the registry, it calls `updateOnChainTriggersByAccount` to update on-chain triggers for the new address.
     * 4. Finally, it updates the `metamaskNotificationsAddressRegistry` state property to include the new address, ensuring no duplicates.
     *
     * @listens AccountsController:selectedAccountChange - Event indicating a change in the selected account.
     */
    messenger.subscribe(
      'AccountsController:selectedAccountChange',
      async ({ address }) => {
        const checksumAddress = toChecksumHexAddress(address);
        if (
          this.state.metamaskNotificationsAddressRegistry.includes(
            checksumAddress,
          )
        ) {
          return;
        }

        await this.updateOnChainTriggersByAccount(checksumAddress);
        this.updateStateProperty(
          'metamaskNotificationsAddressRegistry',
          (currentRegistry) => {
            return [...new Set([...currentRegistry, checksumAddress])];
          },
        );
      },
    );
  }

  /**
   * Generic method to update a specific state property.
   * This method ensures the integrity of the state by updating the property based on the provided value or updater function.
   *
   * @param propertyName - The name of the property in the state to update.
   * @param valueOrUpdater - The new value for the property or an updater function that defines how to update the property.
   */
  private updateStateProperty<
    T extends keyof MetamaskNotificationsControllerState,
  >(
    propertyName: T,
    valueOrUpdater:
      | MetamaskNotificationsControllerState[T]
      | ((
          currentValue: MetamaskNotificationsControllerState[T],
        ) => MetamaskNotificationsControllerState[T]),
  ) {
    this.update((state) => {
      const currentValue = state[propertyName];
      const newValue =
        typeof valueOrUpdater === 'function'
          ? valueOrUpdater(currentValue)
          : valueOrUpdater;
      state[propertyName] = newValue;
      return state;
    });
  }

  /**
   * Initializes the metamaskNotificationsAddressRegistry with unique account addresses.
   * This method is called automatically when the class instance is created.
   */
  private inizializeAddressRegistry() {
    // Fetch the list of accounts
    const accounts = this.messagingSystem.call(
      'AccountsController:listAccounts',
    ) as InternalAccount[];

    // Extract addresses and convert them to checksum addresses to ensure case sensitivity is not an issue
    const addresses = accounts.map((account) =>
      toChecksumHexAddress(account.address),
    );

    // Update the state with unique addresses, avoiding duplicates
    this.updateStateProperty(
      'metamaskNotificationsAddressRegistry',
      (currentRegistry) => {
        const uniqueAddresses = [
          ...new Set([...currentRegistry, ...addresses]),
        ];
        return uniqueAddresses;
      },
    );
  }

  /**
   * Updates the accounts list in the state with the provided list of accounts.
   *
   * @param metamaskNotificationsList - The list of the notifications to update in the state.
   */
  private updateMetamaskNotificationsList(
    metamaskNotificationsList: Notification[],
  ) {
    this.update((state) => {
      state.metamaskNotificationsList = metamaskNotificationsList;
      return state;
    });
  }

  /**
   * Retrieves and parses the user storage from the storage key.
   *
   * This method attempts to retrieve the user storage using the specified storage key,
   * then parses the JSON string to an object. If the storage is not found or cannot be parsed,
   * it throws an error.
   *
   * @returns The parsed user storage object.
   * @throws {Error} If the storage cannot be retrieved or parsed.
   */
  private async getUserStorage(): Promise<UserStorage> {
    const userStorageString: string | null = await this.getStorage(
      'notification_settings',
    );
    if (!userStorageString) {
      throw new Error('User storage does not exist');
    }

    try {
      const userStorage: UserStorage = JSON.parse(userStorageString);
      return userStorage;
    } catch (error) {
      throw new Error('Failed to parse user storage');
    }
  }

  /**
   * Checks for the complete presence of trigger types by group across all addresses in user storage.
   *
   * This method retrieves the user storage and uses `MetamaskNotificationsUtils` to verify if all expected trigger types for each group are present for every address.
   *
   * @returns A record indicating whether all expected trigger types for each group are present for every address.
   * @throws {Error} If user storage does not exist.
   */
  public async checkTriggersPresenceByGroup(): Promise<
    Record<TRIGGER_TYPES_GROUPS, boolean>
  > {
    const userStorage = await this.getUserStorage();

    // Use MetamaskNotificationsUtils to check the presence of triggers
    return this.metamaskNotificationUtils.checkTriggersPresenceByGroup(
      userStorage,
    );
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
    const userStorage = await this.getUserStorage();

    // Use MetamaskNotificationsUtils to check the presence of accounts
    return this.metamaskNotificationUtils.checkAccountsPresence(
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
    if (!this.isSignedIn()) {
      log.error('User is not signed in.');
      this.update((state) => {
        state.isMetamaskNotificationsEnabled = false;
        return state;
      });
      return;
    }

    this.update((state) => {
      state.isMetamaskNotificationsEnabled =
        !state.isMetamaskNotificationsEnabled;
      return state;
    });
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
    if (!this.isSignedIn()) {
      log.error('User is not signed in.');
      this.update((state) => {
        state.isMetamaskNotificationsEnabled = false;
        return state;
      });
      return;
    }

    this.update((state) => {
      // Imposta il valore su true indipendentemente dallo stato precedente
      state.isMetamaskNotificationsFeatureSeen = true;
      return state;
    });
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
    if (!this.isSignedIn()) {
      log.error('User is not signed in.');
      this.update((state) => {
        state.isMetamaskNotificationsEnabled = false;
        return state;
      });
      return;
    }

    this.update((state) => {
      state.isFeatureAnnouncementsEnabled =
        !state.isFeatureAnnouncementsEnabled;
      return state;
    });
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
    if (!this.isSignedIn()) {
      log.error('User is not signed in.');
      this.update((state) => {
        state.isMetamaskNotificationsEnabled = false;
        return state;
      });
      return;
    }

    this.update((state) => {
      state.isSnapNotificationsEnabled = !state.isSnapNotificationsEnabled;
      return state;
    });
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
      const accounts = this.accounts.map((a) =>
        toChecksumHexAddress(a.address),
      );

      const storageKey = this.getStorageKey();
      const bearerToken = this.getBearerToken();

      if (!bearerToken || !storageKey) {
        // Handle the case where bearerToken or storageKey is null
        log.error(
          'Metamask Notifications - Missing BearerToken or storage key',
        );
        throw new Error();
      }

      let userStorage = await this.getUserStorage();

      // If userStorage does not exist, create a new one
      // All the triggers created are set
      // as not enabled
      if (userStorage?.[USER_STORAGE_VERSION_KEY] === undefined) {
        userStorage = this.metamaskNotificationUtils.initializeUserStorage(
          accounts.map((account) => ({ address: account })),
          false,
        );

        // Write the userStorage
        await this.setStorage(
          'notification_settings',
          JSON.stringify(userStorage),
        );
      }

      // Create the triggers
      const triggers =
        this.metamaskNotificationUtils.traverseUserStorageTriggers(userStorage);
      await this.onChainNotificationsService.createOnChainTriggers(
        userStorage,
        storageKey,
        bearerToken,
        triggers,
      );

      // Create push notifications triggers
      const allUUIDS = this.metamaskNotificationUtils.getAllUUIDs(userStorage);
      await this.enablePushNotifications(allUUIDS);

      // Write the new userStorage
      await this.setStorage(
        'notification_settings',
        JSON.stringify(userStorage),
      );

      return userStorage;
    } catch (err) {
      log.error('Failed to create OnChain triggers', err);
      throw new Error();
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
      const storageKey = this.getStorageKey();
      const bearerToken = this.getBearerToken();

      if (!bearerToken || !storageKey) {
        log.error('Missing BearerToken or the Storage Key');
        throw new Error();
      }

      // Get & Validate User Storage
      const userStorage = await this.getUserStorage();

      // Get the UUIDs to delete
      const UUIDs = this.metamaskNotificationUtils.getUUIDsForAccount(
        userStorage,
        account,
      );
      if (UUIDs.length === 0) {
        return userStorage;
      }

      // Delete these UUIDs (Mutates User Storage)
      await this.onChainNotificationsService.deleteOnChainTriggers(
        userStorage,
        storageKey,
        bearerToken,
        UUIDs,
      );

      // Delete these UUIDs from the push notifications
      await this.disablePushNotifications(UUIDs);

      // Update User Storage
      await this.setStorage(
        'notification_settings',
        JSON.stringify(userStorage),
      );

      return userStorage;
    } catch (err) {
      log.error('Failed to delete OnChain triggers', err);
      throw new Error();
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
      const storageKey = this.getStorageKey();
      const bearerToken = this.getBearerToken();

      if (!bearerToken || !storageKey) {
        log.error('Missing BearerToken or the Storage Key');
        throw new Error();
      }

      // Get & Validate User Storage
      const userStorage = await this.getUserStorage();

      // Get the UUIDs to delete
      const UUIDs = this.metamaskNotificationUtils.getUUIDsForKinds(
        userStorage,
        [triggerType],
      );
      if (UUIDs.length === 0) {
        return userStorage;
      }

      // Delete these UUIDs (Mutates User Storage)
      await this.onChainNotificationsService.deleteOnChainTriggers(
        userStorage,
        storageKey,
        bearerToken,
        UUIDs,
      );

      // Delete these UUIDs from the push notifications
      await this.disablePushNotifications(UUIDs);

      // Update User Storage
      await this.setStorage(
        'notification_settings',
        JSON.stringify(userStorage),
      );

      return userStorage;
    } catch (err) {
      log.error('Failed to delete OnChain triggers', err);
      throw new Error();
    }
  }

  /**
   * Updates on-chain triggers for a specific account.
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
      const storageKey = this.getStorageKey();
      const bearerToken = this.getBearerToken();

      if (!bearerToken || !storageKey) {
        log.error('Missing BearerToken or the Storage Key');
        throw new Error();
      }

      // Get & Validate User Storage
      const currentUserStorage = await this.getUserStorage();

      // Check if the address has related UUIDs
      let updatedUserStorage = currentUserStorage;
      updatedUserStorage = this.metamaskNotificationUtils.upsertAddressTriggers(
        account,
        currentUserStorage,
      );

      // Write te updated userStorage
      await this.setStorage(
        'notification_settings',
        JSON.stringify(updatedUserStorage),
      );

      // Check if the address has related UUIDs
      const allowedKinds =
        this.metamaskNotificationUtils.inferEnabledKinds(updatedUserStorage);

      // Create the triggers
      const triggers = this.metamaskNotificationUtils.getUUIDsForAccountByKinds(
        updatedUserStorage,
        account,
        allowedKinds,
      );
      await this.onChainNotificationsService.createOnChainTriggers(
        updatedUserStorage,
        storageKey,
        bearerToken,
        triggers,
      );

      // Update Push Notifications Triggers
      const UUIDs =
        this.metamaskNotificationUtils.getAllUUIDs(updatedUserStorage);
      await this.updatePushNotifications(UUIDs);

      // Update the userStorage
      await this.setStorage(
        'notification_settings',
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
      const storageKey = this.getStorageKey();
      const bearerToken = this.getBearerToken();

      if (!bearerToken || !storageKey) {
        log.error('Missing BearerToken or the Storage Key');
        throw new Error();
      }

      // Get & Validate User Storage
      const currentUserStorage = await this.getUserStorage();

      // Check if the address has related UUIDs
      let updatedUserStorage = currentUserStorage;
      updatedUserStorage =
        this.metamaskNotificationUtils.upsertTriggerTypeTriggers(
          triggerType,
          currentUserStorage,
        );

      // Write te updated userStorage
      await this.setStorage(
        'notification_settings',
        JSON.stringify(updatedUserStorage),
      );

      // Create the triggers
      const triggers =
        this.metamaskNotificationUtils.traverseUserStorageTriggers(
          updatedUserStorage,
        );
      await this.onChainNotificationsService.createOnChainTriggers(
        updatedUserStorage,
        storageKey,
        bearerToken,
        triggers,
      );

      // Update Push Notifications Triggers
      const UUIDs =
        this.metamaskNotificationUtils.getAllUUIDs(updatedUserStorage);
      await this.updatePushNotifications(UUIDs);

      // Update the userStorage
      await this.setStorage(
        'notification_settings',
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
  public async fetchAndUpdateMetamaskNotifications() {
    try {
      // Check if userStorage already exists
      const storageKey = this.getStorageKey();
      const bearerToken = this.getBearerToken();

      if (!bearerToken || !storageKey) {
        // Handle the case where bearerToken or storageKey is null
        log.error(
          'Metamask Notifications - Missing BearerToken or storage key',
        );
        throw new Error();
      }

      // Fetch Feature Announcement Notifications regardless of authentication
      const rawFeatureAnnouncementNotifications =
        await this.featureAnnouncementsService
          .getFeatureAnnouncementNotifications()
          .catch(() => []);

      let rawOnChainNotifications: OnChainRawNotification[] = [];
      if (bearerToken && storageKey) {
        // Get & Validate User Storage
        const userStorage = await this.getUserStorage();

        // Check if the userStorage exists
        if (userStorage) {
          rawOnChainNotifications = await this.onChainNotificationsService
            .getOnChainNotifications(userStorage, bearerToken)
            .catch(() => []);
        }
      }

      const readIds = this.state.metamaskNotificationsReadList;

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

      const metamaskNotifications = [
        ...featureAnnouncementNotifications,
        ...onChainNotifications,
      ];
      metamaskNotifications.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      this.updateMetamaskNotificationsList(metamaskNotifications);
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
   * @throws {Error} Throws an error if marking on-chain notifications as read fails due to missing BearerToken token or any other issue.
   * @returns A promise that resolves when the operation is complete.
   */
  public async markMetamaskNotificationsAsRead(
    notifications: MarkAsReadNotificationsParam,
  ): Promise<void> {
    try {
      // Filter the notifications into undread and onchain/offchain notifications
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

      let onchainNotificationIds: string[] = [];
      let featureAnnouncementNotificationIds: string[] = [];

      // If the onChainNotifications is not empty, start to set the onChainNotifications as read
      if (onChainNotifications.length > 0) {
        const bearerToken = this.getBearerToken();

        if (!bearerToken) {
          log.error('Metamask Notifications - Missing BearerToken');
          throw new Error();
        }

        // 2. If a BearerToken token is available, mark the onchain notifications as read
        if (bearerToken) {
          onchainNotificationIds = onChainNotifications.map(
            (notification) => notification.id,
          );
          await this.onChainNotificationsService.markNotificationsAsRead(
            bearerToken,
            onchainNotificationIds,
          );
        }
      }

      // 3. if the featureAnnouncementNotifications is not empty, get the featureAnnouncementNotificationIds
      if (featureAnnouncementNotifications.length > 0) {
        featureAnnouncementNotificationIds =
          featureAnnouncementNotifications.map(
            (notification) => notification.id,
          );
      }

      // 4. Update the state with the new list of read notifications
      // We use this state to update the counter and the badge
      this.updateStateProperty(
        'metamaskNotificationsReadList',
        (currentReadList) => {
          const newReadIds = [
            ...onchainNotificationIds,
            ...featureAnnouncementNotificationIds,
          ];
          return [...new Set([...currentReadList, ...newReadIds])];
        },
      );
    } catch (err) {
      log.error('Failed to create OnChain triggers', err);
      throw new Error();
    }
  }
}
