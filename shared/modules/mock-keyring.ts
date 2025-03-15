import { Hex } from '@metamask/utils';
import { TypedTransaction, TypedTxData } from '@ethereumjs/tx';
import { Keyring } from '@metamask/keyring-utils';
import { generatePrivateKey, privateKeyToAddress } from 'viem/accounts';
import { getStorageItem, setStorageItem } from '../lib/storage-helpers';
import { MockKeyringBridge } from './mock-keyring-bridge';

const storageKeyHwAccounts = 'mock-hardware-internal-accounts';
const storageKeyAccounts = 'mock-hardware-accounts';
const keyringType = 'Mock Hardware';
const hdPathString = `m/44'/60'/0'`;

type AccountPageEntry = {
  address: string;
  balance: number | null;
  index: number;
};
type AccountPage = AccountPageEntry[];

type MockAccount = {
  address: Hex;
  pk: Hex;
};

type S = { hdPath: string; accounts: MockAccount[] };

export class MockKeyring implements Keyring {
  public readonly type: string = keyringType;

  static type: string = keyringType;

  public hdPath = hdPathString;

  page = 0;

  perPage = 5;

  unlockedAccount = 0;

  #hwAccounts: MockAccount[] = [];

  accounts: MockAccount[] = [];

  bridge: MockKeyringBridge;

  constructor({ bridge }: { bridge: MockKeyringBridge }) {
    this.bridge = bridge;
  }

  async init(): Promise<void> {
    console.log('MockKeyring - init');
    await this.#initHwAccounts(10);
    const storedAccounts = await getStorageItem(storageKeyAccounts);
    this.accounts = storedAccounts ?? [];
    console.log('MockKeyring - init', this.accounts);
  }

  async #initHwAccounts(n: number): Promise<void> {
    const storedHwAccounts = await getStorageItem(storageKeyHwAccounts);
    if (storedHwAccounts && storedHwAccounts.length > 0) {
      this.#hwAccounts = storedHwAccounts;
      return;
    }
    const newHwAccounts = Array.from({ length: n }, () => {
      const pk = generatePrivateKey();
      const address = privateKeyToAddress(pk);
      return {
        address,
        pk,
      };
    });
    this.#hwAccounts = newHwAccounts;
    await setStorageItem(storageKeyHwAccounts, newHwAccounts);
  }

  setHdPath(path: string) {
    this.hdPath = path;
  }

  async getAccounts(): Promise<Hex[]> {
    console.log('MockKeyring - getAccounts', this.accounts);
    return Promise.resolve(this.accounts.map(({ address }) => address));
  }

  async addAccounts(n: number): Promise<Hex[]> {
    console.log('MockKeyring - addAccounts', n);
    const alen = this.accounts.length;
    const tlen = this.#hwAccounts.length;
    if (alen + n > tlen) {
      throw new Error('Not enough accounts');
    }
    const newAccounts = this.#hwAccounts.slice(alen, n);
    this.accounts.push(...newAccounts);

    await setStorageItem(storageKeyAccounts, this.accounts);

    return Promise.resolve(this.accounts.map(({ address }) => address));
  }

  setAccountToUnlock(index: number) {
    this.unlockedAccount = index;
  }

  async generateRandomMnemonic(): Promise<void> {
    return Promise.resolve();
  }

  async getFirstPage(): Promise<AccountPage> {
    console.log('MockKeyring - getFirstPage, accounts:', this.accounts);
    const page = this.#hwAccounts.map((account, index) => ({
      index,
      address: account.address,
      balance: null,
    }));
    console.log('MockKeyring - getFirstPage', page);
    return Promise.resolve(page);
  }

  async getNextPage() {
    console.log('MockKeyring - getNextPage');
    return this.getFirstPage();
  }

  async getPreviousPage() {
    console.log('MockKeyring - getPreviousPage');
    return this.getFirstPage();
  }

  isUnlocked() {
    console.log('MockKeyring - isUnlocked');
    return true;
  }

  async unlock(): Promise<void> {
    console.log('MockKeyring - unlock');
  }

  serialize(): Promise<S> {
    console.log('MockKeyring - serialize');
    return Promise.resolve({ hdPath: this.hdPath, accounts: this.accounts });
  }

  deserialize(state: S): Promise<void> {
    console.log('MockKeyring - deserialize');
    if (!state) {
      return Promise.resolve();
    }
    this.accounts = state?.accounts ?? this.accounts;
    this.hdPath = state?.hdPath ?? this.hdPath;
    return Promise.resolve();
  }

  removeAccount(address: Hex): void {
    console.log('MockKeyring - removeAccount', address);
    this.accounts = this.accounts.filter(({ address: a }) => a !== address);
    setStorageItem(storageKeyAccounts, this.accounts);
  }

  async signTransaction(
    address: Hex,
    transaction: TypedTransaction,
  ): Promise<TypedTxData> {
    console.log('MockKeyring - signTransaction', address, transaction);
    const account = this.accounts.find(({ address: a }) => a === address);
    if (!account) {
      throw new Error('Account not found');
    }
    const signedTx = transaction.sign(
      new Uint8Array(Buffer.from(account.pk, 'hex')),
    );
    return signedTx || transaction;
  }

  async signMessage(
    address: Hex,
    _message: string,
    _options?: Record<string, unknown>,
  ): Promise<string> {
    throw new Error('Method not implemented.');
  }

  async signEip712Message(
    address: Hex,
    _message: string,
    _options?: Record<string, unknown>,
  ): Promise<string> {
    throw new Error('Method not implemented.');
  }

  async signPersonalMessage(
    address: Hex,
    _message: string,
    _options?: Record<string, unknown>,
  ): Promise<string> {
    throw new Error('Method not implemented.');
  }

  signEip7702Authorization?(
    address: Hex,
    authorization: [chainId: number, contractAddress: Hex, nonce: number],
    options?: Record<string, unknown>,
  ): Promise<string> {
    throw new Error('Method not implemented.');
  }
}
