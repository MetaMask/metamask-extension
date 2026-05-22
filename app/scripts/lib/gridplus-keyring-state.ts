import type { AccountMetadata, DeserializeOptions } from '@gridplus/keyring';
import { EXPECTED_SESSION_KEY } from './gridplus-connect';

const HARDENED_OFFSET = 0x80000000;
const STANDARD_HD_PATH = `m/44'/60'/0'/0/x`;

type LegacyAccountOption = {
  walletUID?: unknown;
  hdPath?: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const hasProperty = (
  value: Record<string, unknown>,
  property: string,
): boolean => Object.prototype.hasOwnProperty.call(value, property);

export function normalizeGridPlusKeyringState(
  state: unknown,
): DeserializeOptions {
  if (!isRecord(state)) {
    return {};
  }

  if (!isLegacyGridPlusKeyringState(state)) {
    return state as DeserializeOptions;
  }

  const hdPath =
    typeof state.hdPath === 'string' ? state.hdPath : STANDARD_HD_PATH;
  const accounts = getLegacyAccounts(state, hdPath);

  return {
    deviceId: null,
    deviceType: null,
    sessionKey: EXPECTED_SESSION_KEY,
    hdPath,
    page: getNumber(state.page, 0),
    unlockedAccount: getNextAccountIndex(accounts),
    accounts,
    appName: getAppName(state),
  };
}

function isLegacyGridPlusKeyringState(
  state: Record<string, unknown>,
): boolean {
  return (
    hasProperty(state, 'creds') ||
    hasProperty(state, 'accountIndices') ||
    hasProperty(state, 'accountOpts') ||
    hasProperty(state, 'walletUID') ||
    hasProperty(state, 'network') ||
    hasLegacyAccounts(state.accounts)
  );
}

function hasLegacyAccounts(accounts: unknown): boolean {
  return Array.isArray(accounts) && accounts.some((account) => {
    return typeof account === 'string';
  });
}

function getLegacyAccounts(
  state: Record<string, unknown>,
  fallbackHdPath: string,
): AccountMetadata[] {
  const accounts = Array.isArray(state.accounts) ? state.accounts : [];
  const accountIndices = Array.isArray(state.accountIndices)
    ? state.accountIndices
    : [];
  const accountOpts = Array.isArray(state.accountOpts)
    ? state.accountOpts
    : [];

  return accounts.flatMap((account, position) => {
    if (typeof account !== 'string') {
      return [];
    }

    const accountOpt = accountOpts[position];
    const hdPath = getAccountHdPath(accountOpt, fallbackHdPath);
    const index = getNumber(accountIndices[position], position);
    const metadata: AccountMetadata = {
      address: account,
      signerPath: getSignerPath(hdPath, index),
      hdPath,
      index,
    };
    const walletUID = getWalletUID(accountOpt);

    if (walletUID) {
      metadata.walletUID = walletUID;
    }

    return [metadata];
  });
}

function getAccountHdPath(
  accountOpt: unknown,
  fallbackHdPath: string,
): string {
  if (
    isRecord(accountOpt) &&
    typeof accountOpt.hdPath === 'string' &&
    accountOpt.hdPath
  ) {
    return accountOpt.hdPath;
  }

  return fallbackHdPath;
}

function getWalletUID(accountOpt: unknown): string | undefined {
  if (!isRecord(accountOpt)) {
    return undefined;
  }

  const { walletUID } = accountOpt as LegacyAccountOption;

  if (typeof walletUID === 'string') {
    return walletUID;
  }

  if (
    isRecord(walletUID) &&
    walletUID.type === 'Buffer' &&
    Array.isArray(walletUID.data)
  ) {
    return walletUID.data
      .filter((byte): byte is number => Number.isInteger(byte))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  return undefined;
}

function getAppName(state: Record<string, unknown>): string {
  if (typeof state.appName === 'string' && state.appName) {
    return state.appName;
  }

  if (typeof state.name === 'string' && state.name) {
    return state.name;
  }

  return 'MetaMask';
}

function getNumber(value: unknown, fallback: number): number {
  return Number.isInteger(value) && Number(value) >= 0
    ? Number(value)
    : fallback;
}

function getNextAccountIndex(accounts: AccountMetadata[]): number {
  return accounts.reduce((maxIndex, account) => {
    return Math.max(maxIndex, account.index + 1);
  }, 0);
}

function getSignerPath(hdPath: string, accountIndex: number): number[] {
  const pathComponents = hdPath.split('/').slice(1);
  const signerPath: number[] = [];
  let usedInternalIndex = false;

  for (const component of pathComponents) {
    const isHardened = component.endsWith("'");
    let value = isHardened ? HARDENED_OFFSET : 0;

    if (component.includes('x')) {
      value += accountIndex;
      usedInternalIndex = true;
    } else {
      const rawIndex = isHardened ? component.slice(0, -1) : component;
      const parsedIndex = Number(rawIndex);

      if (!Number.isInteger(parsedIndex) || parsedIndex < 0) {
        return [];
      }

      value += parsedIndex;
    }

    signerPath.push(value);
  }

  if (!usedInternalIndex) {
    signerPath.push(accountIndex);
  }

  return signerPath;
}
