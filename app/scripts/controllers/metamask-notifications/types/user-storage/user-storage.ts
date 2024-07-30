import type {
  SUPPORTED_CHAINS,
  TRIGGER_TYPES,
} from '../../constants/notification-schema';
import type {
  USER_STORAGE_VERSION_KEY,
  USER_STORAGE_VERSION,
} from '../../constants/constants';

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
