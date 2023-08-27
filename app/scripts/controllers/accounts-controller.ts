import {
  BaseControllerV2,
  RestrictedControllerMessenger,
} from '@metamask/base-controller';
import { Patch } from 'immer';
import { v4 as uuid } from 'uuid';
import { sha256FromString } from 'ethereumjs-util';
import {
  InternalAccount,
  ///: BEGIN:ONLY_INCLUDE_IN(keyring-snaps)
  SnapKeyring,
  ///: END:ONLY_INCLUDE_IN(keyring-snaps)
} from '@metamask/eth-snap-keyring';
///: BEGIN:ONLY_INCLUDE_IN(keyring-snaps)
import {
  SnapController,
  SnapControllerEvents,
} from '@metamask/snaps-controllers';
///: END:ONLY_INCLUDE_IN(keyring-snaps)
import {
  KeyringControllerState,
  KeyringController,
  KeyringControllerEvents,
} from '@metamask/keyring-controller';
///: BEGIN:ONLY_INCLUDE_IN(keyring-snaps)
import { SnapControllerState } from '@metamask/snaps-controllers-flask';
///: END:ONLY_INCLUDE_IN(keyring-snaps)

const controllerName = 'AccountsController';

export type AccountsControllerState = {
  internalAccounts: {
    accounts: Record<string, InternalAccount>;
    selectedAccount: string; // id of the selected account
  };
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

export type AccountsControllerSelectedAccountChangeEvent = {
  type: `${typeof controllerName}:selectedAccountChange`;
  payload: [InternalAccount];
};

export type AccountsControllerEvents =
  | AccountsControllerChangeEvent
  | AccountsControllerSelectedAccountChangeEvent
  | SnapControllerEvents
  | KeyringControllerEvents;

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
  internalAccounts: {
    accounts: {
      '': {
        address: '',
      } as InternalAccount,
    },
    selectedAccount: '',
  },
};

export default class AccountsController extends BaseControllerV2<
  typeof controllerName,
  AccountsControllerState,
  AccountsControllerMessenger
> {
  #keyringController: KeyringController;

  ///: BEGIN:ONLY_INCLUDE_IN(keyring-snaps)
  #snapController: SnapController;
  ///: END:ONLY_INCLUDE_IN(keyring-snaps)

  constructor({
    messenger,
    state,
    keyringController,
    ///: BEGIN:ONLY_INCLUDE_IN(keyring-snaps)
    snapController,
    onSnapStateChange,
    ///: END:ONLY_INCLUDE_IN(keyring-snaps)
    onKeyringStateChange,
  }: {
    messenger: AccountsControllerMessenger;
    state: AccountsControllerState;
    keyringController: KeyringController;
    ///: BEGIN:ONLY_INCLUDE_IN(keyring-snaps)
    snapController: SnapController;
    ///: END:ONLY_INCLUDE_IN(keyring-snaps)
    onKeyringStateChange: (
      listener: (keyringState: KeyringControllerState) => void,
    ) => void;
    ///: BEGIN:ONLY_INCLUDE_IN(keyring-snaps)
    onSnapStateChange: (
      listener: (snapState: SnapControllerState) => void,
    ) => void;
    ///: END:ONLY_INCLUDE_IN(keyring-snaps)
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
    ///: BEGIN:ONLY_INCLUDE_IN(keyring-snaps)
    this.#snapController = snapController;
    ///: END:ONLY_INCLUDE_IN(keyring-snaps)

    ///: BEGIN:ONLY_INCLUDE_IN(keyring-snaps)
    onSnapStateChange(async (snapState: SnapControllerState) => {
      // only check if snaps changed in status
      const { snaps } = snapState;
      const accounts = this.listAccounts();

      this.update((currentState: AccountsControllerState) => {
        Object.values(snaps).forEach((snap) => {
          if (!this.#isSnapEnabled(snap.id)) {
            accounts.forEach((account) => {
              if (account.metadata.snap?.id === snap.id) {
                currentState.internalAccounts.accounts[
                  account.id
                ].metadata.snap.enabled = false;
              }
            });
          }
        });
      });
    });
    ///: END:ONLY_INCLUDE_IN(keyring-snaps)

    onKeyringStateChange(async (keyringState: KeyringControllerState) => {
      // check if there are any new accounts added
      // TODO: change when accountAdded event is added to the keyring controller

      if (keyringState.isUnlocked) {
        // TODO: ACCOUNTS_CONTROLLER keyring will return accounts instead of addresses, remove this flatMap after and just get the latest id
        const updatedKeyringAddresses = keyringState.keyrings.flatMap(
          (keyring) => keyring.accounts,
        );
        const previousAccounts = this.listAccounts();

        // if there are no overlaps between the addresses in the keyring and previous accounts,
        // it means the keyring is being reinitialized because the vault is being restored with the same SRP
        const overlaps = updatedKeyringAddresses.filter((address) =>
          previousAccounts.find(
            (account) =>
              account.address.toLowerCase() === address.toLowerCase(),
          ),
        );

        await this.updateAccounts();

        if (updatedKeyringAddresses.length > previousAccounts.length) {
          this.#handleNewAccountAdded(
            updatedKeyringAddresses,
            previousAccounts,
          );
        } else if (
          updatedKeyringAddresses.length > 0 &&
          overlaps.length === 0
        ) {
          // if the keyring is being reinitialized, the selected account will be reset to the first account
          this.setSelectedAccount(this.listAccounts()[0].id);
        } else if (
          updatedKeyringAddresses.length < previousAccounts.length &&
          overlaps.length > 0 &&
          !this.getAccount(this.state.internalAccounts.selectedAccount)
        ) {
          this.#handleSelectedAccountRemoved();
        }
      }
    });

    // if somehow the selected account becomes lost then select the first account
    if (
      this.state.internalAccounts.selectedAccount !== '' &&
      !this.getAccount(this.state.internalAccounts.selectedAccount)
    ) {
      this.setSelectedAccount(this.listAccounts()[0]?.id);
    }
  }

  getAccount(accountId: string): InternalAccount | undefined {
    return this.state.internalAccounts.accounts[accountId];
  }

  listAccounts(): InternalAccount[] {
    return Object.values(this.state.internalAccounts.accounts);
  }

  getAccountExpect(accountId: string): InternalAccount {
    // Edge case where the extension is setup but the srp is not yet created
    // certain ui elements will query the selected address before any accounts are created.
    if (!accountId) {
      return {
        address: '',
      } as InternalAccount;
    }

    const account = this.getAccount(accountId);
    if (account === undefined) {
      throw new Error(`Account Id ${accountId} not found`);
    }
    return account;
  }

  getSelectedAccount(): InternalAccount {
    return this.getAccountExpect(this.state.internalAccounts.selectedAccount);
  }

  async updateAccounts(): Promise<void> {
    let legacyAccounts = await this.#listLegacyAccounts();
    ///: BEGIN:ONLY_INCLUDE_IN(keyring-snaps)
    const snapAccounts = await this.#listSnapAccounts();
    // remove duplicate accounts that are retrieved from the snap keyring.
    legacyAccounts = legacyAccounts.filter(
      (account) =>
        !snapAccounts.find(
          (snapAccount) => snapAccount.address !== account.address,
        ),
    );
    ///: END:ONLY_INCLUDE_IN(keyring-snaps)

    // keyring type map.
    const keyringTypes = new Map<string, number>();
    const previousAccounts = this.state.internalAccounts.accounts;

    const accounts: Record<string, InternalAccount> = [
      ...legacyAccounts,
      ///: BEGIN:ONLY_INCLUDE_IN(keyring-snaps)
      ...snapAccounts,
      ///: END:ONLY_INCLUDE_IN(keyring-snaps)
    ].reduce((internalAccountMap, internalAccount) => {
      const keyringTypeName = keyringTypeToName(
        internalAccount.metadata.keyring.type,
      );
      const keyringAccountIndex = keyringTypes.get(keyringTypeName) ?? 0;
      if (keyringAccountIndex) {
        keyringTypes.set(keyringTypeName, keyringAccountIndex + 1);
      } else {
        keyringTypes.set(keyringTypeName, 1);
      }

      const existingAccount = previousAccounts[internalAccount.id];

      internalAccountMap[internalAccount.id] = {
        ...internalAccount,
        name: existingAccount
          ? existingAccount.name
          : `${keyringTypeName} ${keyringAccountIndex + 1}`,
        metadata: {
          ...internalAccount.metadata,
          lastSelected: existingAccount?.metadata?.lastSelected,
        },
      };

      return internalAccountMap;
    }, {} as Record<string, InternalAccount>);

    this.update((currentState: AccountsControllerState) => {
      currentState.internalAccounts.accounts = accounts;
    });
  }

  ///: BEGIN:ONLY_INCLUDE_IN(keyring-snaps)
  async #listSnapAccounts(): Promise<InternalAccount[]> {
    const [snapKeyring] = this.#keyringController.getKeyringsByType(
      SnapKeyring.type,
    );

    const snapAccounts =
      (await (snapKeyring as SnapKeyring)?.listAccounts(false)) ?? [];

    for (const account of snapAccounts) {
      account.metadata = {
        snap: {
          id: account?.metadata?.snap?.id!,
          enabled: await this.#isSnapEnabled(
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
  ///: END:ONLY_INCLUDE_IN(keyring-snaps)

  // Note: listLegacyAccounts is a temporary method until the keyrings all implement the InternalAccount interface
  async #listLegacyAccounts(): Promise<Omit<InternalAccount, 'name'>[]> {
    const addresses = await this.#keyringController.getAccounts();
    const internalAccounts: Omit<InternalAccount, 'name'>[] = [];
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
          keyring: {
            type: (keyring as any).type as string,
          },
        },
      });
    }

    return internalAccounts.filter(
      (account) => account.metadata.keyring.type !== 'Snap Keyring',
    );
  }

  setSelectedAccount(accountId: string): void {
    const account = this.getAccountExpect(accountId);

    this.update((currentState: AccountsControllerState) => {
      currentState.internalAccounts.accounts[account.id].metadata.lastSelected =
        Date.now();
      currentState.internalAccounts.selectedAccount = account.id;
    });

    this.messagingSystem.publish(`${this.name}:selectedAccountChange`, account);
  }

  setAccountName(accountId: string, accountName: string): void {
    const account = this.getAccountExpect(accountId);

    if (
      this.listAccounts().find(
        (internalAccount) =>
          internalAccount.name === accountName &&
          internalAccount.id !== accountId,
      )
    ) {
      throw new Error('Account name already exists');
    }

    this.update((currentState: AccountsControllerState) => {
      currentState.internalAccounts.accounts[accountId] = {
        ...account,
        name: accountName,
      };
    });
  }

  ///: BEGIN:ONLY_INCLUDE_IN(keyring-snaps)
  async #isSnapEnabled(snapId: string): Promise<boolean> {
    const snap = (await this.#snapController.getSnapState(snapId)) as any;
    if (!snap) {
      return false;
    }
    return snap?.enabled && !snap?.blocked;
  }
  ///: END:ONLY_INCLUDE_IN(keyring-snaps)

  #handleSelectedAccountRemoved() {
    const previousAccount = this.listAccounts()
      .filter(
        (account) => account.id !== this.state.internalAccounts.selectedAccount,
      )
      .sort((accountA, accountB) => {
        // sort by lastSelected descending
        return (
          (accountB.metadata?.lastSelected ?? 0) -
          (accountA.metadata?.lastSelected ?? 0)
        );
      })[0];

    this.setSelectedAccount(previousAccount.id);
  }

  #handleNewAccountAdded(
    updatedKeyringAddresses: string[],
    previousAccounts: InternalAccount[],
  ) {
    const newAddress = updatedKeyringAddresses.find(
      (address) =>
        !previousAccounts.find(
          (account) => account.address.toLowerCase() === address.toLowerCase(),
        ),
    );

    const newAccount = this.listAccounts().find(
      (account) =>
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        account.address.toLowerCase() === newAddress!.toLowerCase(),
    );

    // console.log('new account in onKeyringStateChange', newAccount);

    // set the first new account as the selected account
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.setSelectedAccount(newAccount!.id);
  }
}

export function keyringTypeToName(keyringType: string): string {
  switch (keyringType) {
    case 'Simple Key Pair': {
      return 'Account';
    }
    case 'HD Key Tree': {
      return 'Account';
    }
    case 'Trezor Hardware': {
      return 'Trezor';
    }
    case 'Ledger Hardware': {
      return 'Ledger';
    }
    case 'Lattice Hardware': {
      return 'Lattice';
    }
    case 'QR Hardware Wallet Device': {
      return 'QR';
    }
    case 'Snap Keyring': {
      return 'Snap Account';
    }
    case 'Custody': {
      return 'Custody';
    }
    default: {
      return 'Account';
    }
  }
}
