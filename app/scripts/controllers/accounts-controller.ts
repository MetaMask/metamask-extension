import {
  BaseControllerV2,
  RestrictedControllerMessenger,
} from '@metamask/base-controller';
import { Patch } from 'immer';
import { v4 as uuid } from 'uuid';
import { sha256FromString } from 'ethereumjs-util';
import { InternalAccount, SnapKeyring } from '@metamask/eth-snap-keyring';
import {
  SnapController,
  SnapControllerEvents,
} from '@metamask/snaps-controllers';
import {
  KeyringControllerState,
  KeyringController,
} from '@metamask/keyring-controller';
import { SnapControllerState } from '@metamask/snaps-controllers-flask';
import { add0x } from '@metamask/utils';

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

const defaultState: AccountsControllerState = {
  internalAccounts: {},
  selectedAccount: '',
};

export default class AccountsController extends BaseControllerV2<
  typeof controllerName,
  AccountsControllerState,
  AccountsControllerMessenger
> {
  #keyringController: KeyringController;

  #snapController: SnapController;

  constructor({
    messenger,
    state,
    keyringController,
    snapController,
    onKeyringStateChange,
    onKeyringAccountRemoved,
    onSnapStateChange,
  }: {
    messenger: AccountsControllerMessenger;
    state: AccountsControllerState;
    keyringController: KeyringController;
    snapController: SnapController;
    onKeyringStateChange: (
      listener: (keyringState: KeyringControllerState) => void,
    ) => void;
    onKeyringAccountRemoved: (listener: (address: string) => void) => void;
    onSnapStateChange: (
      listener: (snapState: SnapControllerState) => void,
    ) => void;
  }) {
    super({
      messenger,
      name: controllerName,
      metadata: accountsControllerMetadata,
      state: {
        ...defaultState,
        ...state,
      },
    });

    this.#keyringController = keyringController;
    this.#snapController = snapController;

    onSnapStateChange(async (snapState: SnapControllerState) => {
      console.log('snap state changed', snapState);
      const { snaps } = snapState;

      Object.values(snaps)
        .filter((snap) => !snap.enabled || snap.blocked)
        .forEach((disabledSnap) => {
          this.#disableSnap(disabledSnap.id);
        });

      await this.updateAccounts();
    });

    onKeyringStateChange(async (keyringState: KeyringControllerState) => {
      console.log('keyring state changed', keyringState);
      await this.updateAccounts();
    });

    onKeyringAccountRemoved(async (address: string) => {
      console.log('keyring account removed', address);
      await this.updateAccounts();
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
    const account = this.getAccountId(accountId);
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

    console.log('legacy accounts', legacyAccounts);
    console.log('snap accounts', snapAccounts);

    const internalAccounts = [...legacyAccounts, ...snapAccounts].reduce(
      (internalAccountMap, internalAccount) => {
        internalAccountMap[internalAccount.id] = {
          ...internalAccount,
        };
        return internalAccountMap;
      },
      {} as Record<string, InternalAccount>,
    );

    this.update((currentState: AccountsControllerState) => {
      currentState.internalAccounts = internalAccounts;
    });

    console.log('updated state', this.state);
  }

  removeAccountByAddress(address: string): void {
    const account = this.getAccount(address);
    if (account) {
      this.update((currentState: AccountsControllerState) => {
        delete currentState.internalAccounts[account.id];
      });
    }

    // this.update((currentState: AccountsControllerState) => {
    //   currentState.internalAccounts
    // }
  }

  async #listSnapAccounts(): Promise<InternalAccount[]> {
    const [snapKeyring] = this.#keyringController.getKeyringsByType(
      SnapKeyring.type,
    );

    const snapAccounts =
      (await (snapKeyring as SnapKeyring)?.listAccounts(true)) ?? [];

    for (const account of snapAccounts) {
      account.metadata = {
        snap: {
          id: account?.metadata?.snap?.id,
          enabled: await this.#getSnapStatus(
            account?.metadata?.snap?.id as string,
          ),
          name: account.name,
        },
        keyring: {
          type: (snapKeyring as SnapKeyring).type,
        },
      };
    }

    return snapAccounts;
  }

  async #listLegacyAccounts(): Promise<InternalAccount[]> {
    const addresses = await this.#keyringController.getAccounts();
    const internalAccounts = [];
    for (const address of addresses) {
      const keyring = await this.#keyringController.getKeyringForAccount(
        address,
      );
      // TODO: this is done until the keyrings all implement the InternalAccount interface
      const v4options = {
        random: sha256FromString(address).slice(0, 16),
      };

      internalAccounts.push({
        id: uuid(v4options),
        address,
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
        metadata: {
          keyring: keyring.type as string,
        },
      });
    }

    return internalAccounts.filter(
      (account) => account.metadata.keyring !== 'Snap Keyring',
    );
  }

  setSelectedAccount(accountId: string): void {
    const account = this.getAccountByIdExpect(accountId);

    this.update((currentState: AccountsControllerState) => {
      currentState.selectedAccount = account.id;
    });
  }

  setAccountName(accountId: string, accountName: string): void {
    const account = this.getAccountByIdExpect(accountId);

    this.update((currentState: AccountsControllerState) => {
      currentState.internalAccounts[accountId] = {
        ...account,
        name: accountName,
      };
    });
  }

  #disableSnap(snapId: string) {
    const accounts = this.getAccountsBySnapId(snapId);

    this.update((currentState: AccountsControllerState) => {
      accounts.forEach((account) => {
        account.metadata.snap = {
          ...account.metadata.snap,
          enabled: false,
        };
        currentState.internalAccounts[account.id] = account;
      });
    });
  }

  async #getSnapStatus(snapId: string): Promise<boolean> {
    const snap = await this.#snapController.getSnapState(snapId);
    if (!snap) {
      return false;
    }

    return snap?.enabled && !snap?.blocked;
  }
}
