import { cloneDeep } from 'lodash';
import type { TransactionMeta } from '@metamask/transaction-controller';
import type { LegacyMigration, MigrationState } from '../lib/migrator';

const version = 48;

type LegacyTransactionMeta = TransactionMeta & {
  metamaskNetworkId?: number | string;
};

type LegacyNetworkProvider = {
  type?: string;
  chainId?: string;
  rpcTarget?: string;
  rpcUrl?: string;
  nickname?: string;
  rpcPrefs?: Record<string, unknown>;
  ticker?: string;
  [key: string]: unknown;
};

type AddressBookEntry = Record<string, unknown> & {
  chainId?: string;
};

type TokenObject = {
  address?: string;
  [key: string]: unknown;
};

type LegacyPreferencesController = {
  frequentRpcListDetail?: {
    rpcUrl: string;
    chainId: string;
    ticker: string;
    nickname: string;
    rpcPrefs: Record<string, unknown>;
  }[];
  accountTokens?: Record<
    string,
    Record<string, TokenObject[]> & {
      localhost?: TokenObject[];
      rpc?: TokenObject[];
    }
  >;
  [key: string]: unknown;
};

type LegacyState = MigrationState['data'] &
  Partial<
    Record<
      'NetworkController',
      {
        settings?: Record<string, unknown>;
        provider?: LegacyNetworkProvider;
        [key: string]: unknown;
      }
    >
  > &
  Partial<Record<'PreferencesController', LegacyPreferencesController>> &
  Partial<
    Record<
      'CachedBalancesController',
      { cachedBalances?: unknown; [key: string]: unknown }
    >
  > &
  Partial<
    Record<
      'TransactionController',
      { transactions?: LegacyTransactionMeta[]; [key: string]: unknown }
    >
  > &
  Partial<
    Record<
      'AddressBookController',
      {
        addressBook?: Record<string, Record<string, AddressBookEntry>>;
        [key: string]: unknown;
      }
    >
  > &
  Partial<
    Record<
      'IncomingTransactionsController',
      {
        incomingTxLastFetchedBlocksByNetwork?: Record<string, unknown>;
        [key: string]: unknown;
      }
    >
  >;

/**
 * 1. Delete NetworkController.settings
 * 2a. Migrate NetworkController.provider to Rinkeby if set to type 'rpc' or
 * 'localhost'.
 * 2b. Re-key provider.rpcTarget to provider.rpcUrl
 * 3. Add localhost network to frequentRpcListDetail.
 * 4. Delete CachedBalancesController.cachedBalances
 * 5. Convert transactions metamaskNetworkId to decimal if they are hex
 * 6. Convert address book keys from decimal to hex
 * 7. Delete localhost key in IncomingTransactionsController
 * 8. Merge 'localhost' tokens into 'rpc' tokens
 */
export default {
  version,
  async migrate(originalVersionedData: MigrationState) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    const state = versionedData.data as LegacyState;
    versionedData.data = transformState(state);
    return versionedData;
  },
} satisfies LegacyMigration;

const hexRegEx = /^0x[0-9a-f]+$/iu;
const chainIdRegEx = /^0x[1-9a-f]+[0-9a-f]*$/iu;

function transformState(state: LegacyState = {}): LegacyState {
  // 1. Delete NetworkController.settings
  delete state.NetworkController?.settings;

  // 2. Migrate NetworkController.provider to Rinkeby or rename rpcTarget key
  const provider = state.NetworkController?.provider || {};
  const isCustomRpcWithInvalidChainId =
    provider.type === 'rpc' &&
    (typeof provider.chainId !== 'string' ||
      !chainIdRegEx.test(provider.chainId));
  if (isCustomRpcWithInvalidChainId || provider.type === 'localhost') {
    state.NetworkController ??= {};
    state.NetworkController.provider = {
      type: 'rinkeby',
      rpcUrl: '',
      chainId: '0x4',
      nickname: '',
      rpcPrefs: {},
      ticker: 'ETH',
    };
  } else if (state.NetworkController?.provider) {
    if ('rpcTarget' in state.NetworkController.provider) {
      const rpcUrl = state.NetworkController.provider.rpcTarget;
      state.NetworkController.provider.rpcUrl = rpcUrl;
    }
    delete state.NetworkController?.provider?.rpcTarget;
  }

  // 3.  Add localhost network to frequentRpcListDetail.
  if (!state.PreferencesController) {
    state.PreferencesController = {};
  }
  if (!state.PreferencesController.frequentRpcListDetail) {
    state.PreferencesController.frequentRpcListDetail = [];
  }
  state.PreferencesController.frequentRpcListDetail.unshift({
    rpcUrl: 'http://localhost:8545',
    chainId: '0x539',
    ticker: 'ETH',
    nickname: 'Localhost 8545',
    rpcPrefs: {},
  });

  // 4.  Delete CachedBalancesController.cachedBalances
  delete state.CachedBalancesController?.cachedBalances;

  // 5.  Convert transactions metamaskNetworkId to decimal if they are hex
  const transactions = state.TransactionController?.transactions;
  if (Array.isArray(transactions)) {
    transactions.forEach((transaction) => {
      const metamaskNetworkId = transaction?.metamaskNetworkId;
      if (
        typeof metamaskNetworkId === 'string' &&
        hexRegEx.test(metamaskNetworkId)
      ) {
        transaction.metamaskNetworkId = parseInt(
          metamaskNetworkId,
          16,
        ).toString(10);
      }
    });
  }

  // 6.  Convert address book keys from decimal to hex
  const addressBook = state.AddressBookController?.addressBook || {};
  Object.keys(addressBook).forEach((networkKey) => {
    if (/^\d+$/iu.test(networkKey)) {
      const chainId = `0x${parseInt(networkKey, 10).toString(16)}`;
      updateChainIds(addressBook[networkKey], chainId);

      if (addressBook[chainId]) {
        mergeAddressBookKeys(addressBook, networkKey, chainId);
      } else {
        addressBook[chainId] = addressBook[networkKey];
      }
      delete addressBook[networkKey];
    }
  });

  // 7.  Delete localhost key in IncomingTransactionsController
  delete state.IncomingTransactionsController
    ?.incomingTxLastFetchedBlocksByNetwork?.localhost;

  // 8.  Merge 'localhost' tokens into 'rpc' tokens
  const accountTokens = state.PreferencesController?.accountTokens;
  if (accountTokens) {
    Object.keys(accountTokens).forEach((account) => {
      const localhostTokens = accountTokens[account]?.localhost || [];

      if (localhostTokens.length > 0) {
        const rpcTokens = accountTokens[account].rpc || [];

        if (rpcTokens.length > 0) {
          accountTokens[account].rpc = mergeTokenArrays(
            localhostTokens,
            rpcTokens,
          );
        } else {
          accountTokens[account].rpc = localhostTokens;
        }
      }
      delete accountTokens[account]?.localhost;
    });
  }

  return state;
}

function mergeAddressBookKeys(
  addressBook: Record<string, Record<string, AddressBookEntry>>,
  networkKey: string,
  chainIdKey: string,
): void {
  const networkKeyEntries = addressBook[networkKey] || {};
  const newEntries: Record<string, AddressBookEntry> = {
    ...addressBook[chainIdKey],
  };

  Object.keys(networkKeyEntries).forEach((address) => {
    if (newEntries[address] && typeof newEntries[address] === 'object') {
      const mergedEntry: AddressBookEntry = {};

      new Set([
        ...Object.keys(newEntries[address]),
        ...Object.keys(networkKeyEntries[address] || {}),
      ]).forEach((key) => {
        mergedEntry[key] =
          newEntries[address][key] || networkKeyEntries[address]?.[key] || '';
      });

      newEntries[address] = mergedEntry;
    } else if (
      networkKeyEntries[address] &&
      typeof networkKeyEntries[address] === 'object'
    ) {
      newEntries[address] = networkKeyEntries[address];
    }
  });

  addressBook[chainIdKey] = newEntries;
}

function updateChainIds(
  networkEntries: Record<string, AddressBookEntry>,
  chainId: string,
): void {
  Object.values(networkEntries).forEach((entry) => {
    if (entry && typeof entry === 'object') {
      entry.chainId = chainId;
    }
  });
}

function mergeTokenArrays(
  localhostTokens: TokenObject[],
  rpcTokens: TokenObject[],
): TokenObject[] {
  const localhostTokensMap = tokenArrayToMap(localhostTokens);
  const rpcTokensMap = tokenArrayToMap(rpcTokens);

  const mergedTokens: TokenObject[] = [];
  new Set([
    ...Object.keys(localhostTokensMap),
    ...Object.keys(rpcTokensMap),
  ]).forEach((tokenAddress) => {
    mergedTokens.push({
      ...localhostTokensMap[tokenAddress],
      ...rpcTokensMap[tokenAddress],
    });
  });

  return mergedTokens;

  function tokenArrayToMap(array: TokenObject[]): Record<string, TokenObject> {
    return array.reduce<Record<string, TokenObject>>((map, token) => {
      if (token?.address && typeof token?.address === 'string') {
        map[token.address] = token;
      }
      return map;
    }, {});
  }
}
