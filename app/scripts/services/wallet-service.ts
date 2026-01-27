//========
// `WalletService` holds the methods defined in `MetamaskController.getApi` that
// compose other controllers, and could look like this:
//========

import {
  KeyringControllerGetAccountsAction,
  KeyringControllerWithKeyringAction,
  KeyringTypes,
} from '@metamask/keyring-controller';
import { Messenger } from '@metamask/messenger';
import {
  NetworkClientId,
  NetworkControllerGetNetworkClientByIdAction,
} from '@metamask/network-controller';
import { Hex } from '@metamask/utils';

const MESSENGER_EXPOSED_METHODS = [
  'getCode',
  'addNewAccount',
  // ... etc. ...
] as const;

export type WalletServiceGetCodeAction = {
  type: 'WalletService:getCode';
  handler: (address: Hex, networkClientId: NetworkClientId) => Promise<Hex>;
};

export type WalletServiceAddNewAccountAction = {
  type: 'WalletService:addNewAccount';
  handler: (accountCount: number) => Promise<Hex>;
};

type WalletServiceActions =
  | WalletServiceGetCodeAction
  | WalletServiceAddNewAccountAction;
// etc....

type WalletServiceEvents = never;

//========
// This type doesn't exist in `@metamask/preferences-controller`, we would have
// to add it. This is just here to make the prototype work.
//========
type PreferencesControllerSetSelectedAddressAction = {
  type: 'PreferencesController:setSelectedAddress';
  handler: (address: Hex) => void;
};

type AllowedActions =
  | NetworkControllerGetNetworkClientByIdAction
  | KeyringControllerGetAccountsAction
  | KeyringControllerWithKeyringAction
  | PreferencesControllerSetSelectedAddressAction;
// etc....

type AllowedEvents = never;

export type WalletServiceMessenger = Messenger<
  'WalletService',
  WalletServiceActions | AllowedActions,
  WalletServiceEvents | AllowedEvents
>;

export class WalletService {
  #messenger: WalletServiceMessenger;

  name = 'WalletService' as const;

  constructor({ messenger }: { messenger: WalletServiceMessenger }) {
    this.#messenger = messenger;

    this.#messenger.registerMethodActionHandlers(
      this,
      MESSENGER_EXPOSED_METHODS,
    );
  }

  async getCode(address: Hex, networkClientId: NetworkClientId) {
    const { provider } = this.#messenger.call(
      'NetworkController:getNetworkClientById',
      networkClientId,
    );

    return await provider.request({
      method: 'eth_getCode',
      params: [address],
    });
  }

  async addNewAccount(accountCount: number, keyringId: string) {
    const oldAccounts = await this.#messenger.call(
      'KeyringController:getAccounts',
    );
    const keyringSelector = keyringId
      ? { id: keyringId }
      : { type: KeyringTypes.hd };

    const rawAddedAccountAddress = await this.#messenger.call(
      'KeyringController:withKeyring',
      keyringSelector,
      async ({ keyring }) => {
        if (keyring.type !== KeyringTypes.hd) {
          throw new Error('Cannot add account to non-HD keyring');
        }
        const accountsInKeyring = await keyring.getAccounts();

        // Only add an account if the accountCount matches the accounts in the keyring.
        if (accountCount && accountCount !== accountsInKeyring.length) {
          if (accountCount > accountsInKeyring.length) {
            throw new Error('Account out of sequence');
          }

          const existingAccount = accountsInKeyring[accountCount];

          if (!existingAccount) {
            throw new Error(`Can't find account at index ${accountCount}`);
          }

          return existingAccount;
        }

        const [newAddress] = await keyring.addAccounts(1);
        if (oldAccounts.includes(newAddress)) {
          keyring.removeAccount?.(newAddress);
          throw new Error(`Cannot add duplicate ${newAddress} account`);
        }
        return newAddress;
      },
    );

    // Type assertion: `withKeyring` is generic, but TypeScript isn't able to
    // infer the type parameters because `Messenger.call` is generic too.
    const addedAccountAddress = rawAddedAccountAddress as Hex;

    if (!oldAccounts.includes(addedAccountAddress)) {
      this.#messenger.call(
        'PreferencesController:setSelectedAddress',
        addedAccountAddress,
      );
    }

    return addedAccountAddress;
  }

  // ... etc ...
}
