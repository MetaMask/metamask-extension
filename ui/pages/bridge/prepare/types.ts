import type { InternalAccount } from '@metamask/keyring-internal-api';

type BaseDestinationAccount = {
  isExternal: boolean;
  /**
   * This is used to display the account name in the account picker
   * If the account is external, this is the ENS domain name, or a placeholder label
   * If the account is internal, this is the name of the account group that the account belongs to
   */
  displayName: string;
};

/**
 * External destination accounts are accounts that are not part of the user's internal account tree
 * They are typically ENS domains or other external accounts
 * Populated by the useExternalAccountResolution hook
 */
export type ExternalDestinationAccount = Pick<
  InternalAccount,
  'address' | 'type'
> &
  BaseDestinationAccount;

/**
 * Internal destination accounts are accounts that are part of the user's internal account tree
 * It includes internal account details and metadata appended by the bridge useDestinationAccount hook
 * Populated by the useDestinationAccount hook
 */
export type InternalDestinationAccount = InternalAccount &
  BaseDestinationAccount;

/**
 * Destination accounts are the accounts that the user can select to swap to
 * They are either internal or external accounts
 * Populated by the useDestinationAccount hook or the useExternalAccountResolution hook
 */
export type DestinationAccount =
  | InternalDestinationAccount
  | ExternalDestinationAccount;
