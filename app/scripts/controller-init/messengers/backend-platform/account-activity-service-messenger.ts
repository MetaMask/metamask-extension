import { Messenger } from '@metamask/base-controller';
import type {
  AccountActivityServiceActions,
  AccountActivityServiceEvents,
} from '@metamask/backend-platform';
import type { InternalAccount } from '@metamask/keyring-internal-api';

export type AccountActivityServiceMessenger = ReturnType<
  typeof getAccountActivityServiceMessenger
>;

// External actions that AccountActivityService needs access to
type ExternalActions =
  | {
      type: 'AccountsController:listMultichainAccounts';
      handler: () => InternalAccount[];
    }
  | {
      type: 'AccountsController:getAccountByAddress';
      handler: (address: string) => InternalAccount | undefined;
    };

// External events that AccountActivityService needs to subscribe to
type ExternalEvents =
  | { type: 'AccountsController:accountAdded'; payload: [InternalAccount] }
  | { type: 'AccountsController:accountRemoved'; payload: [string] }
  | { type: 'AccountsController:listMultichainAccounts'; payload: [string] };

/**
 * Get a restricted messenger for the Account Activity service. This is scoped to the
 * actions and events that the Account Activity service is allowed to handle.
 *
 * @param messenger - The messenger to restrict.
 * @returns The restricted messenger.
 */
export function getAccountActivityServiceMessenger(
  messenger: Messenger<AccountActivityServiceActions | ExternalActions, AccountActivityServiceEvents | ExternalEvents>,
) {
  return messenger.getRestricted({
    name: 'AccountActivityService',
    allowedActions: [
      'AccountsController:listMultichainAccounts',
      'AccountsController:getAccountByAddress',
    ],
    allowedEvents: [
      'AccountsController:accountAdded',
      'AccountsController:accountRemoved',
      'AccountsController:listMultichainAccounts',
    ],
  });
}