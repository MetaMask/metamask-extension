import {
  BaseControllerV2,
  RestrictedControllerMessenger,
} from '@metamask/base-controller';
import { Patch } from 'immer';
import { v4 as uuid } from 'uuid';
import { InternalAccount, SnapKeyring } from '@metamask/eth-snap-keyring';
import { KeyringController } from '@metamask/eth-keyring-controller';
import { SnapControllerEvents } from '@metamask/snaps-controllers';
import PreferencesController from './preferences';

const controllerName = 'AccountsController';

export type AccountsControllerState = {
  internalAccounts: Record<string, InternalAccount>;
  selectedAccount: string; // id of the selected account
};

export type AccountsControllerGetStateAction = {
  type: `${typeof controllerName}:getState`;
  handler: () => AccountsControllerState;
};

export type AccountsControllerActions = AccountsControllerGetStateAction;

export type AccountsControllerChangeEvent = {
  type: `${typeof controllerName}:stateChange`;
  payload: [AccountsControllerState, Patch[]];
};

export type AccountsControllerEvents =
  | AccountsControllerChangeEvent
  | SnapControllerEvents;

export type AccountsControllerMessenger = RestrictedControllerMessenger<
  typeof controllerName,
  AccountsControllerActions,
  AccountsControllerEvents,
  string,
  string
>;

const accountsControllerMetadata = {
  internalAccounts: {
    persist: true,
    anonymous: false,
  },
  selectedAccount: {
    persist: true,
    anonymous: false,
  },
};

export default class AccountsController extends BaseControllerV2<
  typeof controllerName,
  AccountsControllerState,
  AccountsControllerMessenger
> {
  #preferenceController: PreferencesController;

  #keyringController: any;

  constructor({
    messenger,
    state,
    preferenceController,
    keyringController,
    onPreferencesStateChange,
  }: {
    messenger: AccountsControllerMessenger;
    state: AccountsControllerState;
    preferenceController: PreferencesController;
    keyringController: KeyringController;
    onPreferencesStateChange: (
      listener: (preferencesState: any) => void,
    ) => void;
  }) {
    super({
      messenger,
      name: controllerName,
      metadata: accountsControllerMetadata,
      state,
    });

    this.#preferenceController = preferenceController;
    this.#keyringController = keyringController;

    this.messagingSystem.subscribe(
      'SnapController:stateChange',
      async (snapState) => {
        console.log('snap state changed', snapState);
      },
    );

    onPreferencesStateChange((preferenceState) => {
      console.log('preference state changed', preferenceState);
      const { selectedAddress } = preferenceState;
      console.log('selected address', selectedAddress);
    });
  }

  getAccount(address: string): InternalAccount | undefined {
    return Object.values(this.state.internalAccounts).find(
      (internalAccount) =>
        internalAccount.address.toLowerCase() === address.toLowerCase(),
    );
  }

  getAccountExpect(address: string): InternalAccount {
    const account = this.getAccount(address);
    if (account === undefined) {
      throw new Error(`Account ${address} not found`);
    }
    return account;
  }

  getAccountId(accountId: string): InternalAccount | undefined {
    return this.state.internalAccounts[accountId];
  }

  getAccountByIdExpect(accountId: string): InternalAccount {
    const account = this.getAccount(accountId);
    if (account === undefined) {
      throw new Error(`Account Id ${accountId} not found`);
    }
    return account;
  }

  getAccountsByKeyring(keyring: string): InternalAccount[] {
    return Object.values(this.state.internalAccounts).filter(
      (internalAccount) => internalAccount.type === keyring,
    );
  }

  getAccountsBySnapId(snapId: string): InternalAccount[] {
    return Object.values(this.state.internalAccounts).filter(
      (internalAccount) => internalAccount.metadata.snap?.id === snapId,
    );
  }

  async updateAccounts(): Promise<void> {
    const legacyAccounts = await this.#listLegacyAccounts();
    const snapAccounts = await this.#listSnapAccounts();

    const internalAccounts = [...legacyAccounts, ...snapAccounts].reduce(
      (internalAccountMap, internalAccount) => {
        internalAccountMap[internalAccount.id] = internalAccount;
        return internalAccountMap;
      },
      {} as Record<string, InternalAccount>,
    );

    this.update((currentState: AccountsControllerState) => {
      currentState.internalAccounts = internalAccounts;
    });
  }

  async #listSnapAccounts(): Promise<InternalAccount[]> {
    const [snapKeyring]: [SnapKeyring] =
      this.#keyringController.getKeyringsByType(SnapKeyring.type);

    return snapKeyring?.listAccounts(true) ?? [];
  }

  async #listLegacyAccounts(): Promise<InternalAccount[]> {
    const addresses = await this.#keyringController.getAccounts();
    return addresses.map((address: string) => {
      return {
        id: uuid(),
        address,
        name: '',
        options: {},
        supportedMethods: [
          'personal_sign',
          'eth_sendTransaction',
          'eth_sign',
          'eth_signTransaction',
          'eth_signTypedData',
          'eth_signTypedData_v1',
          'eth_signTypedData_v2',
          'eth_signTypedData_v3',
          'eth_signTypedData_v4',
        ],
        type: 'eip155:eoa',
        metadata: {},
      };
    });
  }

  setSelectedAccount(accountId: string): InternalAccount {
    const account = this.getAccountByIdExpect(accountId);

    this.update((currentState: AccountsControllerState) => {
      currentState.selectedAccount = account.id;
    });

    return account;
  }

  setLabel(accountId: string, label: string): void {
    const account = this.getAccountByIdExpect(accountId);

    this.update((currentState: AccountsControllerState) => {
      currentState.internalAccounts[accountId] = {
        ...account,
        name: label,
      };
    });
  }
}
