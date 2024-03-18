import type {
  SUPPORTED_CHAINS,
  TRIGGER_TYPES,
} from '../../../../../../shared/constants/metamask-notifications';
import type {
  USER_STORAGE_VERSION_KEY,
  USER_STORAGE_VERSION,
} from '../../../../../../shared/constants/user-storage';

export type UserStorage = {
  /**
   * The Version 'v' of the User Storage.
   * NOTE - will allow us to support upgrade/downgrades in the future
   */
  [USER_STORAGE_VERSION_KEY]: typeof USER_STORAGE_VERSION;
  [address: string]: {
    [chain in (typeof SUPPORTED_CHAINS)[number]]: {
      [uuid: string]: {
        /** Trigger Kind 'k' */
        k: TRIGGER_TYPES;
        /**
         * Trigger Enabled 'e'
         * This is mostly an 'acknowledgement' to determine if a trigger has been made
         * For example if we fail to create a trigger, we can set to false & retry (on re-log in, or elsewhere)
         *
         * Most of the time this is 'true', as triggers when deleted are also removed from User Storage
         */
        e: boolean;
      };
    };
  };
};

type UserStorageEntry = { path: string; entryName: string };

/**
 * The User Storage Endpoint requires a path and an entry name.
 * Developers can provide additional paths by extending this variable below
 */
export const USER_STORAGE_ENTRIES = {
  notification_settings: {
    path: 'notifications',
    entryName: 'notification_settings',
  },
} satisfies Record<string, UserStorageEntry>;

export type UserStorageEntryKeys = keyof typeof USER_STORAGE_ENTRIES;
