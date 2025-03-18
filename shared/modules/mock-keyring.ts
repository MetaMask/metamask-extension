import { Hex } from '@metamask/utils';
import { TypedTransaction, TypedTxData } from '@ethereumjs/tx';
import { Keyring } from '@metamask/keyring-utils';
import {
  generatePrivateKey,
  privateKeyToAccount,
  privateKeyToAddress,
} from 'viem/accounts';
import { createWalletClient, http, serializeSignature, toBytes } from 'viem';
import { eip7702Actions } from 'viem/experimental';
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
    await this.#initHwAccounts(5);
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
    console.debug('MockKeyring - setHdPath', path);
    this.hdPath = path;
  }

  async getAccounts(): Promise<Hex[]> {
    console.debug('MockKeyring - getAccounts', this.accounts);
    return Promise.resolve(this.accounts.map(({ address }) => address));
  }

  async addAccounts(n: number): Promise<Hex[]> {
    console.debug('MockKeyring - addAccounts', n);
    const available = this.#hwAccounts
      .slice(this.unlockedAccount)
      .filter(
        ({ address }) =>
          this.accounts.findIndex(({ address: a }) => a === address) === -1,
      );
    if (n > available.length) {
      throw new Error('Not enough accounts');
    }
    console.debug('MockKeyring - addAccounts before', this.accounts);
    const newAccounts = available.slice(0, n);
    console.debug('MockKeyring - addAccounts newAccounts', newAccounts);
    this.accounts.push(...newAccounts);
    console.debug('MockKeyring - addAccounts after', this.accounts);

    await setStorageItem(storageKeyAccounts, this.accounts);

    return Promise.resolve(newAccounts.map(({ address }) => address));
  }

  setAccountToUnlock(index: number) {
    console.debug('MockKeyring - setAccountToUnlock', index);
    this.unlockedAccount = index;
  }

  async generateRandomMnemonic(): Promise<void> {
    console.debug('MockKeyring - generateRandomMnemonic');
    return Promise.resolve();
  }

  async getFirstPage(): Promise<AccountPage> {
    console.debug('MockKeyring - getFirstPage, accounts:', this.accounts);
    const page = this.#hwAccounts.map((account, index) => ({
      index,
      address: account.address,
      balance: null,
    }));
    console.debug('MockKeyring - getFirstPage', page);
    return Promise.resolve(page);
  }

  async getNextPage() {
    console.debug('MockKeyring - getNextPage');
    return this.getFirstPage();
  }

  async getPreviousPage() {
    console.debug('MockKeyring - getPreviousPage');
    return this.getFirstPage();
  }

  isUnlocked() {
    console.debug('MockKeyring - isUnlocked');
    return true;
  }

  async unlock(): Promise<void> {
    console.debug('MockKeyring - unlock');
  }

  serialize(): Promise<S> {
    console.debug('MockKeyring - serialize');
    return Promise.resolve({ hdPath: this.hdPath, accounts: this.accounts });
  }

  deserialize(state: S): Promise<void> {
    console.debug('MockKeyring - deserialize');
    if (!state) {
      return Promise.resolve();
    }
    this.accounts = state?.accounts ?? this.accounts;
    this.hdPath = state?.hdPath ?? this.hdPath;
    return Promise.resolve();
  }

  removeAccount(address: Hex): void {
    console.debug('MockKeyring - removeAccount', address);
    this.accounts = this.accounts.filter(
      ({ address: a }) => a.toLowerCase() !== address.toLowerCase(),
    );
    setStorageItem(storageKeyAccounts, this.accounts);
  }

  async signTransaction(
    address: Hex,
    transaction: TypedTransaction,
  ): Promise<TypedTxData> {
    console.debug('MockKeyring - signTransaction', address, transaction);
    const account = this.accounts.find(
      ({ address: a }) => a.toLowerCase() === address.toLowerCase(),
    );
    if (!account) {
      throw new Error(`Account not found: ${address}`);
    }
    const signedTx = transaction.sign(toBytes(account.pk));
    if (!signedTx) {
      throw new Error(`Transaction not signed`);
    }
    return signedTx || transaction;
  }

  async signMessage(
    address: Hex,
    _message: string,
    _options?: Record<string, unknown>,
  ): Promise<string> {
    console.debug('MockKeyring - signMessage', address);
    throw new Error('Method not implemented.');
  }

  async signEip712Message(
    address: Hex,
    _message: string,
    _options?: Record<string, unknown>,
  ): Promise<string> {
    console.debug('MockKeyring - signEip712Message', address);
    throw new Error('Method not implemented.');
  }

  async signPersonalMessage(
    address: Hex,
    _message: string,
    _options?: Record<string, unknown>,
  ): Promise<string> {
    console.debug('MockKeyring - signPersonalMessage', address);
    throw new Error('Method not implemented.');
  }

  async signEip7702Authorization(
    address: Hex,
    authorization: [chainId: number, contractAddress: Hex, nonce: number],
    _options?: Record<string, unknown>,
  ): Promise<string> {
    console.debug('MockKeyring.signEip7702Authorization:', {
      address,
      authorization,
    });
    console.debug('MockKeyring.accounts:', this.accounts);
    const account = this.accounts.find(
      (a) => a.address.toLowerCase() === address.toLowerCase(),
    );
    if (!account) {
      throw new Error(`Account not found: ${address}`);
    }
    const walletClient = createWalletClient({
      account: privateKeyToAccount(account.pk),
      transport: http('http://127.0.0.1:8545'),
    }).extend(eip7702Actions());

    const res = await walletClient.signAuthorization({
      chainId: authorization[0],
      contractAddress: authorization[1],
      nonce: authorization[2],
    });
    // signature in hex format
    const sig = serializeSignature({
      r: res.r,
      s: res.s,
      yParity: res.yParity ?? 0,
    });

    return Promise.resolve(sig);
  }
}
