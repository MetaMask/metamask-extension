import { readFile } from 'fs/promises';
import { resolve } from 'path';
import type {
  TronLocalNodeOptions,
  TronTrc10Symbol,
  TronTrc20Symbol,
} from './assets';

export type TronLocalNodeState = Omit<
  TronLocalNodeOptions,
  'loadState' | 'ports'
>;

type TronStateNativeAsset = {
  balance: number;
  decimals?: number;
  name?: string;
  priceUsd?: number | null;
  symbol?: 'TRX';
  type: 'native';
};

type TronStateTrc10Asset = {
  balance: string;
  decimals?: number;
  name?: string;
  priceUsd?: number | null;
  symbol: TronTrc10Symbol;
  tokenId?: string;
  type: 'trc10';
};

type TronStateTrc20Asset = {
  address?: string;
  balance: string;
  decimals?: number;
  name?: string;
  priceUsd?: number | null;
  symbol: TronTrc20Symbol;
  type: 'trc20';
};

type TronStateAsset =
  | TronStateNativeAsset
  | TronStateTrc10Asset
  | TronStateTrc20Asset;

type TronStateAccount = {
  address?: string;
  assets?: TronStateAsset[];
  stakedTrxBalance?: string;
};

type TronStateFile = TronLocalNodeState & {
  accounts?:
    | Record<string, Omit<TronStateAccount, 'address'>>
    | TronStateAccount[];
};

export async function resolveTronLocalNodeOptions(
  options: TronLocalNodeOptions,
): Promise<TronLocalNodeOptions> {
  const { loadState, ports, ...explicitState } = options;
  const loadedState = loadState ? await loadTronState(loadState) : {};

  return {
    ...mergeTronLocalNodeOptions(loadedState, explicitState),
    ...(loadState ? { loadState } : {}),
    ...(ports ? { ports } : {}),
  };
}

export async function loadTronState(
  statePath: string,
): Promise<TronLocalNodeState> {
  const fileContents = await readFile(
    resolve(process.cwd(), statePath),
    'utf8',
  );
  return normalizeTronState(JSON.parse(fileContents) as TronStateFile);
}

export function normalizeTronState(state: TronStateFile): TronLocalNodeState {
  const { accounts, ...rawState } = state;
  return mergeTronLocalNodeOptions(normalizeTronAccounts(accounts), rawState);
}

export function mergeTronLocalNodeOptions(
  baseState: TronLocalNodeState,
  overrideState: TronLocalNodeState,
): TronLocalNodeState {
  return removeUndefinedProperties({
    initialBalances: mergeFlatMap(
      baseState.initialBalances,
      overrideState.initialBalances,
    ),
    stakedTrxBalances: mergeFlatMap(
      baseState.stakedTrxBalances,
      overrideState.stakedTrxBalances,
    ),
    trc10Balances: mergeNestedMap(
      baseState.trc10Balances,
      overrideState.trc10Balances,
    ),
    trc20Balances: mergeNestedMap(
      baseState.trc20Balances,
      overrideState.trc20Balances,
    ),
    trc721Balances: mergeFlatMap(
      baseState.trc721Balances,
      overrideState.trc721Balances,
    ),
    trc1155Balances: mergeFlatMap(
      baseState.trc1155Balances,
      overrideState.trc1155Balances,
    ),
  });
}

function normalizeTronAccounts(
  accounts: TronStateFile['accounts'],
): TronLocalNodeState {
  const normalizedState: TronLocalNodeState = {};

  for (const account of getAccountEntries(accounts)) {
    if (account.stakedTrxBalance) {
      normalizedState.stakedTrxBalances = {
        ...normalizedState.stakedTrxBalances,
        [account.address]: account.stakedTrxBalance,
      };
    }

    for (const asset of account.assets ?? []) {
      if (asset.type === 'native') {
        normalizedState.initialBalances = {
          ...normalizedState.initialBalances,
          [account.address]: asset.balance,
        };
      } else if (asset.type === 'trc10') {
        normalizedState.trc10Balances = {
          ...normalizedState.trc10Balances,
          [account.address]: {
            ...normalizedState.trc10Balances?.[account.address],
            [asset.symbol]: asset.balance,
          },
        };
      } else {
        normalizedState.trc20Balances = {
          ...normalizedState.trc20Balances,
          [account.address]: {
            ...normalizedState.trc20Balances?.[account.address],
            [asset.symbol]: asset.balance,
          },
        };
      }
    }
  }

  return normalizedState;
}

function getAccountEntries(
  accounts: TronStateFile['accounts'],
): (TronStateAccount & { address: string })[] {
  if (!accounts) {
    return [];
  }

  if (Array.isArray(accounts)) {
    return accounts.flatMap((account) =>
      account.address ? [{ ...account, address: account.address }] : [],
    );
  }

  return Object.entries(accounts).map(([address, account]) => ({
    ...account,
    address,
  }));
}

function mergeFlatMap<TValue>(
  baseMap: Record<string, TValue> | undefined,
  overrideMap: Record<string, TValue> | undefined,
): Record<string, TValue> | undefined {
  if (!baseMap && !overrideMap) {
    return undefined;
  }

  return { ...baseMap, ...overrideMap };
}

function mergeNestedMap<TNestedKey extends string>(
  baseMap: Record<string, Partial<Record<TNestedKey, string>>> | undefined,
  overrideMap: Record<string, Partial<Record<TNestedKey, string>>> | undefined,
): Record<string, Partial<Record<TNestedKey, string>>> | undefined {
  if (!baseMap && !overrideMap) {
    return undefined;
  }

  const merged = { ...baseMap };
  for (const [address, balances] of Object.entries(overrideMap ?? {})) {
    merged[address] = {
      ...merged[address],
      ...balances,
    };
  }

  return merged;
}

function removeUndefinedProperties<TObject extends Record<string, unknown>>(
  object: TObject,
): Partial<TObject> {
  return Object.fromEntries(
    Object.entries(object).filter(([, value]) => value !== undefined),
  ) as Partial<TObject>;
}
