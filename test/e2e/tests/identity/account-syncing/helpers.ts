import { isManifestV3 } from '../../../../../shared/modules/mv3.utils';

export const IS_ACCOUNT_SYNCING_ENABLED = isManifestV3;

export type UserStorageAccount = {
  /**
   * The Version 'v' of the User Storage.
   * NOTE - will allow us to support upgrade/downgrades in the future
   */
  v: string;
  /** the id 'i' of the account */
  i: string;
  /** the address 'a' of the account */
  a: string;
  /** the name 'n' of the account */
  n: string;
  /** the nameLastUpdatedAt timestamp 'nlu' of the account */
  nlu?: number;
};
