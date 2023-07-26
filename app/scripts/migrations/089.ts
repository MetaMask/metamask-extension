import { getCaipChainIdFromEthChainId } from '@metamask/controller-utils';
import { hasProperty, isObject } from '@metamask/utils';
import { cloneDeep, mapKeys, mapValues } from 'lodash';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 89;

/**
 * TODO UPDATE THIS DESC
 *
 * @param originalVersionedData - Versioned MetaMask extension state, exactly what we persist to dist.
 * @param originalVersionedData.meta - State metadata.
 * @param originalVersionedData.meta.version - The current state version.
 * @param originalVersionedData.data - The persisted MetaMask state, keyed by controller.
 * @returns Updated versioned MetaMask extension state.
 */
export async function migrate(
  originalVersionedData: VersionedData,
): Promise<VersionedData> {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;
  migrateData(versionedData.data);
  return versionedData;
}

function migrateData(state: Record<string, unknown>): void {
  if (hasProperty(state, 'NftController') && isObject(state.NftController)) {
    const nftControllerState = state.NftController;

    // Migrate NftController.allNftContracts
    if (
      hasProperty(nftControllerState, 'allNftContracts') &&
      isObject(nftControllerState.allNftContracts)
    ) {
      const { allNftContracts } = nftControllerState;

      if (
        Object.keys(allNftContracts).every((address) =>
          isObject(allNftContracts[address]),
        )
      ) {
        Object.keys(allNftContracts).forEach((address) => {
          const nftContractsByChainId = allNftContracts[address];

          if (isObject(nftContractsByChainId)) {
            allNftContracts[address] = mapKeys(
              nftContractsByChainId,
              (_, chainId: string) => getCaipChainIdFromEthChainId(chainId),
            );
          }
        });
      }
    }

    // Migrate NftController.allNfts
    if (
      hasProperty(nftControllerState, 'allNfts') &&
      isObject(nftControllerState.allNfts)
    ) {
      const { allNfts } = nftControllerState;

      if (Object.keys(allNfts).every((address) => isObject(allNfts[address]))) {
        Object.keys(allNfts).forEach((address) => {
          const nftsByChainId = allNfts[address];

          if (isObject(nftsByChainId)) {
            allNfts[address] = mapKeys(nftsByChainId, (_, chainId: string) =>
              getCaipChainIdFromEthChainId(chainId),
            );
          }
        });
      }
    }

    state.NftController = nftControllerState;
  }

  if (
    hasProperty(state, 'TokenListController') &&
    isObject(state.TokenListController)
  ) {
    const tokenListControllerState = state.TokenListController;

    // Migrate TokenListController.tokensChainsCache
    if (
      hasProperty(tokenListControllerState, 'tokensChainsCache') &&
      isObject(tokenListControllerState.tokensChainsCache)
    ) {
      tokenListControllerState.tokensChainsCache = mapKeys(
        tokenListControllerState.tokensChainsCache,
        (_, chainId: string) => getCaipChainIdFromEthChainId(chainId),
      );
    }
  }

  if (
    hasProperty(state, 'TokensController') &&
    isObject(state.TokensController)
  ) {
    const tokensControllerState = state.TokensController;

    // Migrate TokensController.allTokens
    if (
      hasProperty(tokensControllerState, 'allTokens') &&
      isObject(tokensControllerState.allTokens)
    ) {
      const { allTokens } = tokensControllerState;

      tokensControllerState.allTokens = mapKeys(
        allTokens,
        (_, chainId: string) => getCaipChainIdFromEthChainId(chainId),
      );
    }

    // Migrate TokensController.allIgnoredTokens
    if (
      hasProperty(tokensControllerState, 'allIgnoredTokens') &&
      isObject(tokensControllerState.allIgnoredTokens)
    ) {
      const { allIgnoredTokens } = tokensControllerState;

      tokensControllerState.allIgnoredTokens = mapKeys(
        allIgnoredTokens,
        (_, chainId: string) => getCaipChainIdFromEthChainId(chainId),
      );
    }

    // Migrate TokensController.allDetectedTokens
    if (
      hasProperty(tokensControllerState, 'allDetectedTokens') &&
      isObject(tokensControllerState.allDetectedTokens)
    ) {
      const { allDetectedTokens } = tokensControllerState;

      tokensControllerState.allDetectedTokens = mapKeys(
        allDetectedTokens,
        (_, chainId: string) => getCaipChainIdFromEthChainId(chainId),
      );
    }

    state.TokensController = tokensControllerState;
  }

  if (
    hasProperty(state, 'NetworkController') &&
    isObject(state.NetworkController)
  ) {
    const networkControllerState = state.NetworkController;

    // Migrate NetworkController.providerConfig
    if (
      hasProperty(networkControllerState, 'providerConfig') &&
      isObject(networkControllerState.providerConfig)
    ) {
      const { providerConfig } = networkControllerState;

      providerConfig.caipChainId = getCaipChainIdFromEthChainId(
        providerConfig.chainId,
      ); // is this safe?
      delete providerConfig.chainId;
    }

    // Migrate NetworkController.networkConfigurations
    if (
      hasProperty(networkControllerState, 'networkConfigurations') &&
      isObject(networkControllerState.networkConfigurations)
    ) {
      const { networkConfigurations } = networkControllerState;

      networkControllerState.networkConfigurations = mapValues(
        networkConfigurations,
        (networkConfiguration) => {
          networkConfiguration.caipChainId = getCaipChainIdFromEthChainId(
            networkConfiguration.chainId,
          ); // is this safe?
          delete networkConfiguration.chainId;
          return networkConfiguration;
        },
      );
    }

    state.NetworkController = networkControllerState;
  }

  // Should we migrate this, or just clear it completely?
  if (
    hasProperty(state, 'CachedBalancesController') &&
    isObject(state.CachedBalancesController)
  ) {
    const cachedBalancesControllerState = state.CachedBalancesController;

    // Migrate CachedBalancesController.cachedBalances
    if (
      hasProperty(cachedBalancesControllerState, 'cachedBalances') &&
      isObject(cachedBalancesControllerState.cachedBalances)
    ) {
      const { cachedBalances } = cachedBalancesControllerState;

      cachedBalancesControllerState.cachedBalances = mapKeys(
        cachedBalances,
        (_, chainId: string) => getCaipChainIdFromEthChainId(chainId), // this is not safe? may be networkid. update this
      );
    }

    state.CachedBalancesController = cachedBalancesControllerState;
  }

  if (
    hasProperty(state, 'AddressBookController') &&
    isObject(state.AddressBookController)
  ) {
    const addressBookControllerState = state.AddressBookController;

    // Migrate AddressBookController.addressBook
    if (
      hasProperty(addressBookControllerState, 'addressBook') &&
      isObject(addressBookControllerState.addressBook)
    ) {
      let { addressBook } = addressBookControllerState;

      addressBook = mapKeys(
        addressBook,
        (_, chainId: string) => getCaipChainIdFromEthChainId(chainId), // is this safe?
      );

      addressBookControllerState.addressBook = mapValues(
        addressBook,
        (addressBookEntries) => {
          if (!isObject(addressBookEntries)) {
            return addressBookEntries;
          }

          return mapValues(addressBookEntries, (addressBookEntry) => {
            addressBookEntry.caipChainId = getCaipChainIdFromEthChainId(
              addressBookEntry.chainId,
            ); // is this safe?
            delete addressBookEntry.chainId;
            return addressBookEntry
          });
        },
      );
    }

    state.AddressBookController = addressBookControllerState;
  }

  if (
    hasProperty(state, 'AppStateController') &&
    isObject(state.AppStateController)
  ) {
    const appStateControllerState = state.AppStateController;

    // Migrate AppStateController.usedNetworks
    if (
      hasProperty(appStateControllerState, 'usedNetworks') &&
      isObject(appStateControllerState.usedNetworks)
    ) {
      const { usedNetworks } = appStateControllerState;

      appStateControllerState.usedNetworks = mapKeys(
        usedNetworks,
        (_, chainId: string) => getCaipChainIdFromEthChainId(chainId), // is this safe?
      );
    }

    state.AppStateController = appStateControllerState;
  }

  if (
    hasProperty(state, 'IncomingTransactionsController') &&
    isObject(state.IncomingTransactionsController)
  ) {
    const incomingTransactionsControllerState =
      state.IncomingTransactionsController;

    // Migrate IncomingTransactionsController.incomingTransactions
    if (
      hasProperty(
        incomingTransactionsControllerState,
        'incomingTransactions',
      ) &&
      isObject(incomingTransactionsControllerState.incomingTransactions)
    ) {
      const { incomingTransactions } = incomingTransactionsControllerState;

      incomingTransactionsControllerState.incomingTransactions = mapValues(
        incomingTransactions,
        (transaction) => {
          transaction.caipChainId = getCaipChainIdFromEthChainId(
            transaction.chainId,
          ); // is this safe?
          delete transaction.chainId;
          return transaction;
        },
      );
    }

    // Migrate IncomingTransactionsController.incomingTxLastFetchedBlockByChainId
    if (
      hasProperty(
        incomingTransactionsControllerState,
        'incomingTxLastFetchedBlockByChainId',
      ) &&
      isObject(
        incomingTransactionsControllerState.incomingTxLastFetchedBlockByChainId,
      )
    ) {
      const { incomingTxLastFetchedBlockByChainId } =
        incomingTransactionsControllerState;

      incomingTransactionsControllerState.incomingTxLastFetchedBlockByChainId =
        mapKeys(
          incomingTxLastFetchedBlockByChainId,
          (_, chainId: string) => getCaipChainIdFromEthChainId(chainId), // is this safe?
        );
    }

    state.IncomingTransactionsController = incomingTransactionsControllerState;
  }

  if (
    hasProperty(state, 'TransactionController') &&
    isObject(state.TransactionController)
  ) {
    const transactionControllerState = state.TransactionController;

    // Migrate TransactionController.transactions
    if (
      hasProperty(transactionControllerState, 'transactions') &&
      isObject(transactionControllerState.transactions)
    ) {
      const { transactions } = transactionControllerState;

      transactionControllerState.transactions = mapValues(
        transactions,
        (transaction) => {
          transaction.caipChainId = getCaipChainIdFromEthChainId(
            transaction.chainId,
          ); // is this safe?
          delete transaction.chainId;

          if (
            hasProperty(transaction, 'history') &&
            Array.isArray(transaction.history)
          ) {
            const { history } = transaction;

            transaction.history = history.map((entry) => {
              if (isObject(entry) && hasProperty(entry, 'chainId')) {
                entry.caipChainId = getCaipChainIdFromEthChainId(entry.chainId); // is this safe?
                delete entry.chainId;
              }

              return entry;
            });
          }

          return transaction;
        },
      );
    }

    state.TransactionController = transactionControllerState;
  }

  // Is this necessary? is TxController state not just derived from TransactionController state?
  if (hasProperty(state, 'TxController') && isObject(state.TxController)) {
    const txControllerState = state.TxController;

    // Migrate TxController.currentNetworkTxList
    if (
      hasProperty(txControllerState, 'currentNetworkTxList') &&
      Array.isArray(txControllerState.currentNetworkTxList)
    ) {
      const { currentNetworkTxList } = txControllerState;

      txControllerState.currentNetworkTxList = currentNetworkTxList.map(
        (transaction) => {
          transaction.caipChainId = getCaipChainIdFromEthChainId(
            transaction.chainId,
          ); // is this safe?
          delete transaction.chainId;

          if (
            hasProperty(transaction, 'history') &&
            Array.isArray(transaction.history)
          ) {
            const { history } = transaction;

            transaction.history = history.map((entry) => {
              if (isObject(entry) && hasProperty(entry, 'chainId')) {
                entry.caipChainId = getCaipChainIdFromEthChainId(entry.chainId); // is this safe?
                delete entry.chainId;
              }

              return entry;
            });
          }

          return transaction;
        },
      );
    }

    // Migrate TxController.unapprovedTxs
    if (
      hasProperty(txControllerState, 'unapprovedTxs') &&
      isObject(txControllerState.unapprovedTxs)
    ) {
      const { unapprovedTxs } = txControllerState;

      txControllerState.unapprovedTxs = mapValues(
        unapprovedTxs,
        (transaction) => {
          transaction.caipChainId = getCaipChainIdFromEthChainId(
            transaction.chainId,
          ); // is this safe?
          delete transaction.chainId;

          if (
            hasProperty(transaction, 'history') &&
            Array.isArray(transaction.history)
          ) {
            const { history } = transaction;

            transaction.history = history.map((entry) => {
              if (isObject(entry) && hasProperty(entry, 'chainId')) {
                entry.caipChainId = getCaipChainIdFromEthChainId(entry.chainId); // is this safe?
                delete entry.chainId;
              }

              return entry;
            });
          }

          return transaction;
        },
      );
    }

    state.TxController = txControllerState;
  }

  // TODO: SmartTransactionsController

  // What to do about MMI?
  // ui/selectors/institutional/selectors.test.js
}
