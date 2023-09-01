import type { RestrictedControllerMessenger } from '@metamask/base-controller';
import { BaseControllerV2 } from '@metamask/base-controller';
import { SnapKeyring } from '@metamask/eth-snap-keyring';
import type { InternalAccount } from '@metamask/keyring-api';
import type {
  KeyringControllerState,
  KeyringController,
  KeyringControllerEvents,
} from '@metamask/keyring-controller';
import type {
  SnapControllerEvents,
  SnapControllerState,
} from '@metamask/snaps-controllers';
import { sha256FromString } from 'ethereumjs-util';
import type { Patch } from 'immer';
import { v4 as uuid } from 'uuid';

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
    accounts: {},
    selectedAccount: '',
  },
};

export class AccountsController extends BaseControllerV2<
  typeof controllerName,
  AccountsControllerState,
  AccountsControllerMessenger
> {
  getKeyringForAccount: KeyringController['getKeyringForAccount'];

  getKeyringByType: KeyringController['getKeyringsByType'];

  getAccounts: KeyringController['getAccounts'];

  keyringApiEnabled: boolean;

  constructor({
    messenger,
    state,
    keyringApiEnabled,
    getKeyringForAccount,
    getKeyringByType,
    getAccounts,
    onSnapStateChange,
    onKeyringStateChange,
  }: {
    messenger: AccountsControllerMessenger;
    state: AccountsControllerState;
    keyringApiEnabled?: boolean;
    getKeyringForAccount: KeyringController['getKeyringForAccount'];
    getKeyringByType: KeyringController['getKeyringsByType'];
    getAccounts: KeyringController['getAccounts'];
    onKeyringStateChange: (
      listener: (keyringState: KeyringControllerState) => void,
    ) => void;
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

    this.getKeyringForAccount = getKeyringForAccount;
    this.getKeyringByType = getKeyringByType;
    this.getAccounts = getAccounts;
    this.keyringApiEnabled = Boolean(keyringApiEnabled);

    if (this.keyringApiEnabled) {
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      onSnapStateChange(async (snapState: SnapControllerState) => {
        // only check if snaps changed in status
        const { snaps } = snapState;
        const accounts = this.listAccounts();

        this.update((currentState: AccountsControllerState) => {
          accounts.forEach((account) => {
            const currentAccount =
              currentState.internalAccounts.accounts[account.id];
            if (currentAccount && currentAccount.metadata.snap) {
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore this account is guaranteed to have snap metadata
              currentState.internalAccounts.accounts[
                account.id
              ].metadata.snap.enabled =
                snaps[currentAccount.metadata.snap.id].enabled &&
                !snaps[currentAccount.metadata.snap.id].blocked;
            }
          });
        });
      });
    }

    onKeyringStateChange(
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      async (keyringState: KeyringControllerState): Promise<void> => {
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
      },
    );

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
        id: '',
        address: '',
        options: {},
        methods: [],
        type: 'eip155:eoa',
        metadata: {
          name: '',
          keyring: {
            type: '',
          },
        },
      };
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

  setSelectedAccount(accountId: string): void {
    const account = this.getAccountExpect(accountId);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore Type instantiation is excessively deep and possibly infinite.
    this.update((currentState: AccountsControllerState) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore lastSelected will be added in 0.2.2
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
          internalAccount.metadata.name === accountName &&
          internalAccount.id !== accountId,
      )
    ) {
      throw new Error('Account name already exists');
    }

    this.update((currentState: AccountsControllerState) => {
      currentState.internalAccounts.accounts[accountId] = {
        ...account,
        metadata: {
          ...account.metadata,
          name: accountName,
        },
      };
    });
  }

  async updateAccounts(): Promise<void> {
    let legacyAccounts = await this.#listLegacyAccounts();
    let snapAccounts: InternalAccount[] = [];
    if (this.keyringApiEnabled) {
      snapAccounts = await this.#listSnapAccounts();
      // remove duplicate accounts that are retrieved from the snap keyring.
      legacyAccounts = legacyAccounts.filter(
        (account) =>
          !snapAccounts.find(
            (snapAccount) => snapAccount.address === account.address,
          ),
      );
    }

    // keyring type map.
    const keyringTypes = new Map<string, number>();
    const previousAccounts = this.state.internalAccounts.accounts;

    const accounts: Record<string, InternalAccount> = [
      ...legacyAccounts,
      ...snapAccounts,
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

        metadata: {
          ...internalAccount.metadata,
          name:
            existingAccount && existingAccount.metadata.name !== ''
              ? existingAccount.metadata.name
              : `${keyringTypeName} ${keyringAccountIndex + 1}`,
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore lastSelected will be added in 0.2.2
          lastSelected: existingAccount?.metadata?.lastSelected,
        },
      };

      return internalAccountMap;
    }, {} as Record<string, InternalAccount>);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore Type instantiation is excessively deep and possibly infinite.
    this.update((currentState: AccountsControllerState) => {
      currentState.internalAccounts.accounts = accounts;
    });
  }

  loadBackup(backup: AccountsControllerState): void {
    if (backup.internalAccounts) {
      this.update((currentState: AccountsControllerState) => {
        currentState.internalAccounts = backup.internalAccounts;
      });
    }
  }

  async #listSnapAccounts(): Promise<InternalAccount[]> {
    const [snapKeyring] = this.getKeyringByType(SnapKeyring.type);

    const snapAccounts = await (snapKeyring as SnapKeyring).listAccounts(false);

    for (const account of snapAccounts) {
      // The snap account is guaranteed to have a snap metadata
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const snapId = account.metadata.snap!.id!;

      account.metadata = {
        snap: {
          id: snapId,
          enabled: true,
          name: '',
        },
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore snap keyring not updated yet
        name: '',
        keyring: {
          type: (snapKeyring as SnapKeyring).type,
        },
      };
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore lastSelected will be added in 0.2.2
    return snapAccounts;
  }

  // Note: listLegacyAccounts is a temporary method until the keyrings all implement the InternalAccount interface
  async #listLegacyAccounts(): Promise<InternalAccount[]> {
    const addresses = await this.getAccounts();
    const internalAccounts: InternalAccount[] = [];
    for (const address of addresses) {
      const keyring = await this.getKeyringForAccount(address);
      const v4options = {
        random: sha256FromString(address).slice(0, 16),
      };

      internalAccounts.push({
        id: uuid(v4options),
        address,
        options: {},
        methods: [
          'personal_sign',
          'eth_sign',
          'eth_signTransaction',
          'eth_signTypedData',
          'eth_signTypedData_v1',
          'eth_signTypedData_v3',
          'eth_signTypedData_v4',
        ],
        type: 'eip155:eoa',
        metadata: {
          name: '',
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

  #handleSelectedAccountRemoved() {
    const previousAccount = this.listAccounts()
      .filter(
        (account) => account.id !== this.state.internalAccounts.selectedAccount,
      )
      .sort((accountA, accountB) => {
        // sort by lastSelected descending
        return (
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          (accountB.metadata?.lastSelected ?? 0) -
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
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

    // set the first new account as the selected account
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.setSelectedAccount(newAccount!.id);
  }
}

/**
 * Returns the name of the keyring type.
 *
 * @param keyringType - The type of the keyring.
 * @returns The name of the keyring type.
 */
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
      console.warn(`Unknown keyring ${keyringType}`);
      return 'Account';
    }
  }
}
