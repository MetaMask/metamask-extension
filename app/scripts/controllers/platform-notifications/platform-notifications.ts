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
import type { UserStorage } from '../user-storage/types/types';
import type {
  UserStorageControllerGetUserStorage,
  UserStorageControllerBuildUserStorage,
  UserStorageControllerUpsertUserStorage,
} from '../user-storage/user-storage';
import { TRIGGER_TYPES } from '../../../../shared/constants/platform-notifications';
import { USER_STORAGE_VERSION_KEY } from '../../../../shared/constants/user-storage';
import { FeatureAnnouncementsService } from './services/feature-announcements';
import { OnChainNotificationsService } from './services/onchain-notifications';
import type {
  Notification,
  MarkAsReadNotificationsParam,
} from './types/notification/notification';
import { OnChainRawNotification } from './types/on-chain-notification/on-chain-notification';
import { FeatureAnnouncementRawNotification } from './types/feature-announcement/feature-announcement';
import { processNotification } from './processors/process-notifications';
import { PlatformNotificationUtils } from './utils/utils';

// Unique name for the controller
const controllerName = 'PlatformNotificationsController';

/**
 * State shape for PlatformNotificationsController
 */
export type PlatformNotificationsControllerState = {
  platformNotificationsAreEnabled: boolean;
  /**
   * List of platform notifications
   */
  platformNotificationsList: Notification[];

  /**
   * List of read platform notifications
   */
  platformNotificationsReadList: string[];

  /**
   * List of unread platform notifications
   */
  platformNotificationsUnreadList: string[];

  /**
   * Loading state for platform notifications
   */
  platformNotificationsIsLoading: boolean;

  /**
   * List of addresses to be used to create the onChain triggers
   */
  platformNotificationsAddressRegistry: string[];
};

// Describes the action for updating the accounts list
export type PlatformNotificationsControllerUpdateNotificationsListAction = {
  type: `${typeof controllerName}:updatePlatformNotificationsList`;
  handler: PlatformNotificationsController['updatePlatformNotificationsList'];
};

// Describes the action for updating the loading state
export type PlatformNotificationsControllerUpdateLoadingStateAction = {
  type: `${typeof controllerName}:updatePlatformNotificationsIsLoadingState`;
  handler: (isLoading: boolean) => void;
};

// Union of all possible actions for the messenger
export type PlatformNotificationsControllerMessengerActions =
  | PlatformNotificationsControllerUpdateNotificationsListAction
  | PlatformNotificationsControllerUpdateLoadingStateAction
  | ControllerGetStateAction<'state', PlatformNotificationsControllerState>;

type AllowedActions =
  | UserStorageControllerGetUserStorage
  | UserStorageControllerBuildUserStorage
  | UserStorageControllerUpsertUserStorage
  | AccountsControllerListAccountsAction;

export type PlatformNotificationsControllerMessengerEvents =
  ControllerStateChangeEvent<
    typeof controllerName,
    PlatformNotificationsControllerState
  >;

type AllowedEvents = AccountsControllerSelectedAccountChangeEvent;

// Type for the messenger of PlatformNotificationsController
export type PlatformNotificationsControllerMessenger =
  RestrictedControllerMessenger<
    typeof controllerName,
    PlatformNotificationsControllerMessengerActions | AllowedActions,
    AllowedEvents,
    AllowedActions['type'],
    AllowedEvents['type']
  >;

// Metadata for the controller state
const metadata = {
  platformNotificationsAreEnabled: {
    persist: true,
    anonymous: true,
  },
  platformNotificationsList: {
    persist: true,
    anonymous: true,
  },
  platformNotificationsReadList: {
    persist: true,
    anonymous: true,
  },
  platformNotificationsUnreadList: {
    persist: true,
    anonymous: true,
  },
  platformNotificationsIsLoading: {
    persist: false,
    anonymous: true,
  },
  platformNotificationsAddressRegistry: {
    persist: true,
    anonymous: true,
  },
};

/**
 * Controller that updates the PlatformNotifications and the ReadPlatformNotifications list.
 * This controller subscribes to account state changes and ensures
 * that the account list is updated based on the latest account configurations.
 */
export class PlatformNotificationsController extends BaseController<
  typeof controllerName,
  PlatformNotificationsControllerState,
  PlatformNotificationsControllerMessenger
> {
  private featureAnnouncementsService: FeatureAnnouncementsService;

  private onChainNotificationsService: OnChainNotificationsService;

  private platformNotificationUtils: PlatformNotificationUtils;

  private getJwtToken: () => string;

  private getStorageKey: () => string;

  private accounts: InternalAccount[];

  /**
   * Creates a PlatformNotificationsController instance.
   *
   * @param args - The arguments to this function.
   * @param args.messenger - Messenger used to communicate with BaseV2 controller.
   * @param args.state - Initial state to set on this controller.
   * @param args.getJwtToken - Function that returns the jet token for this controller.
   * @param args.getStorageKey - Function that returns the storage key for this controller.
   */
  constructor({
    messenger,
    state,
    getJwtToken,
    getStorageKey,
  }: {
    messenger: PlatformNotificationsControllerMessenger;
    state?: PlatformNotificationsControllerState;
    getJwtToken: () => string;
    getStorageKey: () => string;
  }) {
    const platformNotificationsList = state?.platformNotificationsList || [];
    const platformNotificationsReadList =
      state?.platformNotificationsReadList || [];
    const platformNotificationsUnreadList =
      state?.platformNotificationsUnreadList || [];
    const platformNotificationsIsLoading =
      state?.platformNotificationsIsLoading || false;
    const platformNotificationsAreEnabled =
      state?.platformNotificationsAreEnabled || false;
    const platformNotificationsAddressRegistry =
      state?.platformNotificationsAddressRegistry || [];

    // Call the constructor of BaseControllerV2
    super({
      messenger,
      metadata,
      name: controllerName,
      state: {
        platformNotificationsIsLoading,
        platformNotificationsList,
        platformNotificationsReadList,
        platformNotificationsUnreadList,
        platformNotificationsAreEnabled,
        platformNotificationsAddressRegistry,
      },
    });

    this.featureAnnouncementsService = new FeatureAnnouncementsService();
    this.onChainNotificationsService = new OnChainNotificationsService();

    this.platformNotificationUtils = new PlatformNotificationUtils();

    this.accounts = this.messagingSystem.call(
      'AccountsController:listAccounts',
    ) as InternalAccount[];

    this.getJwtToken = getJwtToken;

    this.getStorageKey = getStorageKey;

    this.inizializeAddressRegistry();

    /**
     * Subscribes to account selection changes to update on-chain triggers and the address registry.
     *
     * This method listens for changes in the selected account from the AccountsController.
     * When an account change is detected, it performs the following actions:
     * 1. Converts the account address to a checksum address for consistency.
     * 2. Checks if the checksum address is already present in the `platformNotificationsAddressRegistry`.
     * - If it is, the function exits early to avoid unnecessary updates.
     * 3. If the address is not in the registry, it calls `updateOnChainTriggersByAccount` to update on-chain triggers for the new address.
     * 4. Finally, it updates the `platformNotificationsAddressRegistry` state property to include the new address, ensuring no duplicates.
     *
     * @listens AccountsController:selectedAccountChange - Event indicating a change in the selected account.
     */
    messenger.subscribe(
      'AccountsController:selectedAccountChange',
      async ({ address }) => {
        const checksumAddress = toChecksumHexAddress(address);
        if (
          this.state.platformNotificationsAddressRegistry.includes(
            checksumAddress,
          )
        ) {
          return;
        }

        await this.updateOnChainTriggersByAccount(checksumAddress);
        this.updateStateProperty(
          'platformNotificationsAddressRegistry',
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
    T extends keyof PlatformNotificationsControllerState,
  >(
    propertyName: T,
    valueOrUpdater:
      | PlatformNotificationsControllerState[T]
      | ((
          currentValue: PlatformNotificationsControllerState[T],
        ) => PlatformNotificationsControllerState[T]),
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
   * Initializes the platformNotificationsAddressRegistry with unique account addresses.
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
      'platformNotificationsAddressRegistry',
      (currentRegistry) => {
        const uniqueAddresses = [
          ...new Set([...currentRegistry, ...addresses]),
        ];
        return uniqueAddresses;
      },
    );
  }

  /**
   * Updates the loading state in the state with the provided value.
   *
   * @param isLoading - The loading state to update in the state.
   */
  private updatePlatformNotificationsIsLoadingState(isLoading: boolean) {
    this.update((state) => {
      state.platformNotificationsIsLoading = isLoading;
      return state;
    });
  }

  /**
   * Updates the accounts list in the state with the provided list of accounts.
   *
   * @param platformNotificationsList - The list of the notifications to update in the state.
   */
  private updatePlatformNotificationsList(
    platformNotificationsList: Notification[],
  ) {
    this.update((state) => {
      state.platformNotificationsList = platformNotificationsList;
      return state;
    });
  }

  /**
   * Toggles the enabled state of platform notifications.
   *
   * This method checks for the presence of a JWT token and a storage key before attempting to toggle the notification state.
   * If either the JWT token or the storage key is missing, the method disables platform notifications and logs an error.
   * Otherwise, it toggles the current state of platform notifications (enabled/disabled).
   *
   * @async
   * @throws {Error} If updating the state fails.
   */
  public async toggleNotificationsEnabled() {
    const jwt = this.getJwtToken();
    const storageKey = this.getStorageKey();

    // If the jwt or the storage key are not available, we disable the notifications
    // the user will not be able to enable them again until the jwt and the storage key are available
    if (!jwt || !storageKey) {
      this.update((state) => {
        state.platformNotificationsAreEnabled = false;
        return state;
      });
      log.error('Platform Notifications - Missing JWT or storage key');
    }

    this.update((state) => {
      state.platformNotificationsAreEnabled =
        !state.platformNotificationsAreEnabled;
      return state;
    });
  }

  /**
   * This initializes on-chain triggers (used during sign in process)
   * This method checks for existing user storage and creates a new one if necessary.
   * It then proceeds to create on-chain triggers and updates the user storage accordingly.
   *
   * @returns The updated or newly created user storage.
   * @throws {Error} Throws an error if JWT or storage key is missing, or if the operation fails.
   */
  public async createOnChainTriggers(): Promise<UserStorage> {
    try {
      const accounts = this.accounts.map((a) =>
        toChecksumHexAddress(a.address),
      );

      // Check if userStorage already exists
      const storageKey = this.getStorageKey();
      const jwt = this.getJwtToken();

      if (!jwt || !storageKey) {
        // Handle the case where jwt or storageKey is null
        log.error('Platform Notifications - Missing JWT or storage key');
        throw new Error();
      }

      let userStorage: UserStorage | null = null;

      // Retrieve and decrypt user storage
      userStorage = await this.messagingSystem.call(
        'UserStorageController:getUserStorage',
      );

      // If userStorage does not exist, create a new one
      // All the triggers created are set
      // as not enabled
      if (userStorage?.[USER_STORAGE_VERSION_KEY] === undefined) {
        userStorage = this.messagingSystem.call(
          'UserStorageController:buildUserStorage',
          accounts.map((account) => ({ address: account })),
          false,
        );

        // Write the userStorage
        await this.messagingSystem.call(
          'UserStorageController:upsertUserStorage',
          JSON.stringify(userStorage),
        );
      }

      // Create the triggers
      const triggers =
        this.platformNotificationUtils.traverseUserStorageTriggers(userStorage);
      await this.onChainNotificationsService.createOnChainTriggers(
        userStorage,
        storageKey,
        jwt,
        triggers,
      );

      // TODO Update push notifications triggers

      // Write the new userStorage
      await this.messagingSystem.call(
        'UserStorageController:upsertUserStorage',
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
   * 1. Validates the presence of a JWT token and a user storage key. If either is missing, an error is thrown.
   * 2. Retrieves and validates the user storage. If the user storage does not exist, an error is thrown.
   * 3. Identifies the UUIDs associated with the account to be deleted. If no UUIDs are found, the method returns early with a success message.
   * 4. Deletes the identified UUIDs from the on-chain triggers, effectively removing the triggers associated with the account.
   * 5. Updates the user storage to reflect the deletion of the triggers.
   *
   * @param account - The account for which on-chain triggers are to be deleted.
   * @returns A promise that resolves to void or an object containing a success message.
   * @throws An error if JWT or storage key is missing, if user storage does not exist, or if the deletion operation fails.
   */
  public async deleteOnChainTriggersByAccount(
    account: string,
  ): Promise<void | { data: string }> {
    try {
      // Get and Validate JWT and User Storage Key
      const storageKey = this.getStorageKey();
      const jwt = this.getJwtToken();

      if (!jwt || !storageKey) {
        log.error('Missing JWT or the Storage Key');
        throw new Error();
      }

      // Get & Validate User Storage
      const userStorage: UserStorage | null = await this.messagingSystem.call(
        'UserStorageController:getUserStorage',
      );
      if (!userStorage) {
        log.error('User storage does not exist');
        throw new Error();
      }

      // Get the UUIDs to delete
      const UUIDs = this.platformNotificationUtils.getUUIDsForAccount(
        userStorage,
        account,
      );
      if (UUIDs.length === 0) {
        return { data: 'OK' };
      }

      // Delete these UUIDs (Mutates User Storage)
      await this.onChainNotificationsService.deleteOnChainTriggers(
        userStorage,
        storageKey,
        jwt,
        UUIDs,
      );

      // Update User Storage
      await this.messagingSystem.call(
        'UserStorageController:upsertUserStorage',
        JSON.stringify(userStorage),
      );

      // TODO Update push notifications triggers

      return { data: 'OK' };
    } catch (err) {
      log.error('Failed to delete OnChain triggers', err);
      throw new Error();
    }
  }

  /**
   * Deletes on-chain triggers based on the specified trigger type.
   * This method performs several key operations:
   * 1. Validates the presence of a JWT token and a user storage key. If either is missing, an error is thrown.
   * 2. Retrieves and validates the user storage. If the user storage does not exist, an error is thrown.
   * 3. Identifies the UUIDs associated with the specified trigger type. If no UUIDs are found, the method returns early with a success message.
   * 4. Deletes the identified UUIDs from the on-chain triggers, effectively removing the triggers associated with the specified trigger type.
   * 5. Updates the user storage to reflect the deletion of the triggers.
   *
   * @param triggerType - The type of trigger to delete.
   * @returns A promise that resolves to void or an object containing a success message.
   * @throws An error if JWT or storage key is missing, if user storage does not exist, or if the deletion operation fails.
   */
  public async deleteOnChainTriggersByTriggerType(
    triggerType: TRIGGER_TYPES,
  ): Promise<void | { data: string }> {
    try {
      // Get and Validate JWT and User Storage Key
      const storageKey = this.getStorageKey();
      const jwt = this.getJwtToken();

      if (!jwt || !storageKey) {
        log.error('Missing JWT or the Storage Key');
        throw new Error();
      }

      // Get & Validate User Storage
      const userStorage: UserStorage | null = await this.messagingSystem.call(
        'UserStorageController:getUserStorage',
      );
      if (!userStorage) {
        log.error('User storage does not exist');
        throw new Error();
      }

      // Get the UUIDs to delete
      const UUIDs = this.platformNotificationUtils.getUUIDsForKinds(
        userStorage,
        [triggerType],
      );
      if (UUIDs.length === 0) {
        return { data: 'OK' };
      }

      // Delete these UUIDs (Mutates User Storage)
      await this.onChainNotificationsService.deleteOnChainTriggers(
        userStorage,
        storageKey,
        jwt,
        UUIDs,
      );

      // Update User Storage
      await this.messagingSystem.call(
        'UserStorageController:upsertUserStorage',
        JSON.stringify(userStorage),
      );

      // TODO Update push notifications triggers

      return { data: 'OK' };
    } catch (err) {
      log.error('Failed to delete OnChain triggers', err);
      throw new Error();
    }
  }

  /**
   * Updates on-chain triggers for a specific account.
   * This method performs several key operations:
   * 1. Validates the presence of a JWT token and a user storage key. If either is missing, an error is thrown.
   * 2. Retrieves and validates the current user storage. If the user storage does not exist, an error is thrown.
   * 3. Updates the user storage by upserting triggers related to the specified account.
   * 4. Validates the kinds of notifications that are enabled for the account.
   * 5. Creates on-chain triggers based on the allowed kinds of notifications.
   * 6. Updates the user storage with the new or modified triggers.
   * 7. (TODO) Updates push notifications triggers.
   *
   * @param account - The account for which on-chain triggers are to be updated.
   * @returns A promise that resolves to the updated user storage.
   * @throws An error if JWT or storage key is missing, if user storage does not exist, or if the operation fails.
   */
  public async updateOnChainTriggersByAccount(account: string) {
    try {
      // Get and Validate JWT and User Storage Key
      const storageKey = this.getStorageKey();
      const jwt = this.getJwtToken();

      if (!jwt || !storageKey) {
        log.error('Missing JWT or the Storage Key');
        throw new Error();
      }

      // Get & Validate User Storage
      const currentUserStorage: UserStorage | null =
        await this.messagingSystem.call('UserStorageController:getUserStorage');
      if (!currentUserStorage) {
        log.error('Current user storage does not exist');
        throw new Error();
      }

      // Check if the address has related UUIDs
      let updatedUserStorage = currentUserStorage;
      updatedUserStorage = this.platformNotificationUtils.upsertAddressTriggers(
        account,
        currentUserStorage,
      );

      // Write te updated userStorage
      await this.messagingSystem.call(
        'UserStorageController:upsertUserStorage',
        JSON.stringify(updatedUserStorage),
      );

      // Check if the address has related UUIDs
      const allowedKinds =
        this.platformNotificationUtils.inferEnabledKinds(updatedUserStorage);

      // Create the triggers
      const triggers = this.platformNotificationUtils.getUUIDsForAccountByKinds(
        updatedUserStorage,
        account,
        allowedKinds,
      );
      await this.onChainNotificationsService.createOnChainTriggers(
        updatedUserStorage,
        storageKey,
        jwt,
        triggers,
      );

      // Update the userStorage
      await this.messagingSystem.call(
        'UserStorageController:upsertUserStorage',
        JSON.stringify(updatedUserStorage),
      );

      // TODO Update Push Notifications Triggers

      return { data: updatedUserStorage };
    } catch (err) {
      log.error('Failed to update OnChain triggers', err);
      throw new Error();
    }
  }

  /**
   * Updates on-chain triggers based on the specified trigger type.
   * This method performs several key operations:
   * 1. Validates the presence of a JWT token and a user storage key. If either is missing, an error is thrown.
   * 2. Retrieves and validates the current user storage. If the user storage does not exist, an error is thrown.
   * 3. Updates the user storage by upserting triggers related to the specified trigger type.
   * 4. Creates on-chain triggers based on the updated user storage.
   * 5. Updates the user storage with the new or modified triggers.
   * 6. (TODO) Updates push notifications triggers.
   *
   * @param triggerType - The type of trigger to update.
   * @returns A promise that resolves to the updated user storage.
   * @throws An error if JWT or storage key is missing, if user storage does not exist, or if the operation fails.
   */
  public async updateOnChainTriggersByType(triggerType: TRIGGER_TYPES) {
    try {
      // Get and Validate JWT and User Storage Key
      const storageKey = this.getStorageKey();
      const jwt = this.getJwtToken();

      if (!jwt || !storageKey) {
        log.error('Missing JWT or the Storage Key');
        throw new Error();
      }

      // Get & Validate User Storage
      const currentUserStorage: UserStorage | null =
        await this.messagingSystem.call('UserStorageController:getUserStorage');
      if (!currentUserStorage) {
        log.error('Current user storage does not exist');
        throw new Error();
      }

      // Check if the address has related UUIDs
      let updatedUserStorage = currentUserStorage;
      updatedUserStorage =
        this.platformNotificationUtils.upsertTriggerTypeTriggers(
          triggerType,
          currentUserStorage,
        );

      // Write te updated userStorage
      await this.messagingSystem.call(
        'UserStorageController:upsertUserStorage',
        JSON.stringify(updatedUserStorage),
      );

      // Create the triggers
      const triggers =
        this.platformNotificationUtils.traverseUserStorageTriggers(
          updatedUserStorage,
        );
      await this.onChainNotificationsService.createOnChainTriggers(
        updatedUserStorage,
        storageKey,
        jwt,
        triggers,
      );

      // Update the userStorage
      await this.messagingSystem.call(
        'UserStorageController:upsertUserStorage',
        JSON.stringify(updatedUserStorage),
      );

      // TODO Update Push Notifications Triggers

      return { data: updatedUserStorage };
    } catch (err) {
      log.error('Failed to update OnChain triggers', err);
      throw new Error();
    }
  }

  /**
   * Fetches and updates the list of platform notifications.
   *
   * This method performs several key operations to update the platform notifications:
   * 1. Sets the loading state to true at the beginning of the operation.
   * 2. Validates the presence of a JWT token and a storage key. If either is missing, logs an error and throws an exception.
   * 3. Fetches raw feature announcement notifications regardless of the user's authentication status.
   * 4. If a JWT token and storage key are present, it attempts to fetch raw on-chain notifications.
   * 5. Processes both feature announcement and on-chain notifications, filtering out any undefined values.
   * 6. Sorts the combined list of notifications by their creation date in descending order.
   * 7. Updates the platform notifications list with the processed notifications.
   * 8. Sets the loading state to false at the end of the operation.
   *
   * If any errors occur during the process, it logs the error and throws an exception.
   *
   * @async
   * @throws {Error} If there's an issue fetching the notifications or if required credentials are missing.
   */
  public async fetchAndUpdatePlatformNotifications() {
    try {
      this.updatePlatformNotificationsIsLoadingState(true);

      // Check if userStorage already exists
      const storageKey = this.getStorageKey();
      const jwt = this.getJwtToken();

      if (!jwt || !storageKey) {
        // Handle the case where jwt or storageKey is null
        log.error('Platform Notifications - Missing JWT or storage key');
        throw new Error();
      }

      // Fetch Feature Announcement Notifications regardless of authentication
      const rawFeatureAnnouncementNotifications =
        await this.featureAnnouncementsService
          .getFeatureAnnouncementNotifications()
          .catch(() => []);

      let rawOnChainNotifications: OnChainRawNotification[] = [];
      if (jwt && storageKey) {
        // Get & Validate User Storage
        const userStorage: UserStorage | null = await this.messagingSystem.call(
          'UserStorageController:getUserStorage',
        );

        if (!userStorage) {
          log.error('User storage does not exist');
          throw new Error();
        }

        // Check if the userStorage exists
        if (userStorage) {
          rawOnChainNotifications = await this.onChainNotificationsService
            .getOnChainNotifications(userStorage, jwt)
            .catch(() => []);
        }
      }

      const readIds = this.state.platformNotificationsReadList;

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

      const platformNotifications = [
        ...featureAnnouncementNotifications,
        ...onChainNotifications,
      ];
      platformNotifications.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      this.updatePlatformNotificationsList(platformNotifications);
      this.updatePlatformNotificationsIsLoadingState(false);
    } catch (err) {
      log.error('Failed to fetch notifications', err);
      throw new Error('Failed to fetch notifications');
    }
  }

  /**
   * Marks specified platform notifications as read.
   *
   * This method processes a list of notifications, segregating them into on-chain and feature announcement notifications.
   * It then marks each notification as read by updating the relevant service or state. For on-chain notifications, it requires
   * a JWT token to proceed. If the JWT token is missing, an error is logged, and the process is halted. After successfully
   * marking the notifications as read, it updates the internal state to reflect these changes, ensuring the UI components
   * can accurately display read/unread notifications.
   *
   * @param notifications - An array of notifications to be marked as read. Each notification should include its type and read status.
   * @throws {Error} Throws an error if marking on-chain notifications as read fails due to missing JWT token or any other issue.
   * @returns A promise that resolves when the operation is complete.
   */
  public async markPlatformNotificationsAsRead(
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
        const jwt = this.getJwtToken();

        if (!jwt) {
          log.error('Platform Notifications - Missing JWT');
          throw new Error();
        }

        // 2. If a JWT token is available, mark the onchain notifications as read
        if (jwt) {
          onchainNotificationIds = onChainNotifications.map(
            (notification) => notification.id,
          );
          await this.onChainNotificationsService.markNotificationsAsRead(
            jwt,
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
        'platformNotificationsReadList',
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
