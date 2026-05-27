import { EventEmitter } from 'eventemitter3';

export type DeviceType = 'lattice' | 'cadix';

export interface AccountMetadata {
  address: string;
  signerPath: number[];
  hdPath: string;
  index: number;
  walletUID?: string;
}

export interface KeyringState {
  deviceId: string | null;
  deviceType: DeviceType | null;
  sessionKey: string;
  hdPath: string;
  page: number;
  unlockedAccount: number;
  accounts: AccountMetadata[];
  appName: string;
}

export interface DeserializeOptions extends Partial<KeyringState> {
  name?: string;
}

export interface PagedAccount {
  address: string;
  balance: null;
  index: number;
}

export interface ConnectApiConfig {
  baseUrl: string;
  sessionKey: string;
  timeout?: number;
}

export type OpenConnectCallback = (url: string) => Promise<{
  deviceId: string;
  sessionKey: string;
  deviceType?: DeviceType;
}>;

export interface KeyringOptions {
  api?: Partial<ConnectApiConfig>;
  connectPageUrl?: string;
  appName?: string;
  openConnect?: OpenConnectCallback;
  state?: DeserializeOptions;
}

export class GridPlusKeyring extends EventEmitter {
  static type: string;
  readonly type: string;
  appName?: string;
  network?: string;

  constructor(opts?: KeyringOptions);

  serialize(): Promise<KeyringState>;
  deserialize(opts?: DeserializeOptions): Promise<void>;

  isUnlocked(): boolean;
  unlock(): Promise<string>;

  setHdPath(hdPath: string): void;
  getHdPath(): string;
  setAccountToUnlock(index: number | string): void;
  getFirstPage(): Promise<PagedAccount[]>;
  getNextPage(): Promise<PagedAccount[]>;
  getPreviousPage(): Promise<PagedAccount[]>;

  addAccounts(n?: number): Promise<string[]>;
  getAccounts(): Promise<string[]>;
  removeAccount(address: string): void;
  forgetDevice(): void;

  signTransaction(address: string, tx: unknown): Promise<unknown>;
  signPersonalMessage(address: string, message: string): Promise<string>;
  signTypedData(
    address: string,
    typedData: unknown,
    opts?: { version?: string },
  ): Promise<string>;
  signMessage(address: string, message: unknown): Promise<string>;
  exportAccount(address: string): Promise<never>;
}

export default GridPlusKeyring;

export const HARDENED_OFFSET: number;
export const PER_PAGE: number;
export const STANDARD_HD_PATH: string;
export const INTERNAL_VAR_HD_PATH: string;
export const LEGACY_HD_PATH: string;
