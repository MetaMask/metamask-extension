import EventEmitter from 'events';
import { v4 as uuid } from 'uuid';
import { InternalAccount, SnapKeyring } from '@metamask/eth-snap-keyring';
import { SnapController } from '@metamask/snaps-controllers';
import { ObservableStore } from '@metamask/obs-store';
import { CaseInsensitiveMap } from './CaseInsensitiveMap';
import { setAsyncInterval } from './async-interval';
import PreferencesController from './controllers/preferences';

export class AccountsController extends EventEmitter {
  #keyringController: any;

  #snapsController: SnapController;

  #preferencesController: PreferencesController;

  #addressToAccount: CaseInsensitiveMap<InternalAccount>;

  store: ObservableStore<{ internalAccounts: InternalAccount[] }>;

  constructor(
    keyringController: any,
    snapsController: SnapController,
    preferencesController: PreferencesController,
  ) {
    super();
    this.#keyringController = keyringController;
    this.#snapsController = snapsController;
    this.#preferencesController = preferencesController;
    this.#addressToAccount = new CaseInsensitiveMap();
    this.store = new ObservableStore({ internalAccounts: [] });

    this.#keyringController.on('update', () => {
      this.listAccounts();
    });

    setAsyncInterval(async () => {
      await this.listAccounts();
    }, 10000);
  }

  getAccount(address: string): InternalAccount | undefined {
    return this.#addressToAccount.get(address);
  }

  getAccountExpect(address: string): InternalAccount {
    const account = this.getAccount(address);
    if (account === undefined) {
      throw new Error(`Account ${address} not found`);
    }
    return account;
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

  async #listSnapAccounts(): Promise<InternalAccount[]> {
    const [snapKeyring]: [SnapKeyring] =
      this.#keyringController.getKeyringsByType(SnapKeyring.type);

    return snapKeyring?.listAccounts(true) ?? [];
  }

  async listAccounts(): Promise<InternalAccount[]> {
    console.log('Syncing accounts...');

    const preferences = this.#preferencesController.store.getState();

    const legacyAccounts = await this.#listLegacyAccounts();
    const snapAccounts = await this.#listSnapAccounts();
    const snapAddresses = snapAccounts.map((account) =>
      account.address.toLowerCase(),
    );

    const accounts = legacyAccounts
      .filter(
        (account) => !snapAddresses.includes(account.address.toLowerCase()),
      )
      .concat(snapAccounts);

    // Remove all accounts and start fresh
    this.#addressToAccount.clear();

    for (const account of accounts) {
      // Add snap metadata
      if (account.metadata.snap?.id !== undefined) {
        const snap = this.#snapsController.get(account.metadata.snap.id);
        if (snap !== undefined) {
          account.metadata.snap = {
            ...account.metadata.snap,
            name: snap.manifest.proposedName,
            enabled: snap.enabled,
          };
        }
      }

      // Resolve account name
      if (account.name === '') {
        account.name =
          preferences.identities[account.address.toLowerCase()].name ??
          'Account';
      }

      // Add account (back) to map
      this.#addressToAccount.set(account.address, account);
    }

    this.store.updateState({ internalAccounts: accounts });
    console.log('Synced accounts:', accounts);
    return accounts;
  }
}
