<<<<<<< HEAD
import { buildEthCaipChainId } from '@metamask/controller-utils';
import { hasProperty, isObject } from '@metamask/utils';
import { cloneDeep, mapKeys, mapValues } from 'lodash';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 91;

/**
 * - Rebuilds `allNftContracts` and `allNfts` in NftController state to be keyed
 * by a caip chain ID rather than a hex chain ID.
 * - Rebuilds `tokensChainsCache` in TokenListController to be keyed by a caip
 * chain ID rather than a hex chain ID.
 * - Rebuilds `allTokens`, `allIgnoredTokens`, and `allDetectedTokens` in TokensController
 * to be keyed by a caip chain ID rather than a hex chain ID.
 * - Rebuilds `providerConfig` and `networkConfigurations` in NetworkController to have
 * `caipChainId` field rather than a hex `chainId` field.
 * - Rebuilds `cachedBalances` in CachedBalancesController to be keyed by a caip
 * chain ID rather than a hex chain ID.
 * - Rebuilds `addressBook` in AddressBookController to be keyed by a caip chain ID
 * rather than a hex chain ID and to have `caipChainId` field rather than a
 * hex * `chainId` field.
 * - Rebuilds `usedNetworks` in AppStateController to be keyed by a caip * chain ID
 * rather than a hex chain ID.
 * - Rebuilds `incomingTransactions` in IncomingTransactionsController to have
 * `caipChainId` field rather than a hex `chainId` field.
 * - Rebuilds `incomingTxLastFetchedBlockByChainId` in IncomingTransactionsController
 * to be keyed by a caip chain ID rather than a hex chain ID.
 * - Rebuilds `transactions` and `transactions.history` in TransactionController to have
 * `caipChainId` field rather than a hex `chainId` field.
 * - Rebuilds `currentNetworkTxList` and `currentNetworkTxList.history` in TxController
 * to have `caipChainId` field rather than a hex `chainId` field.
 * - Rebuilds `unapprovedTxs` and `unapprovedTxs.history` in TxController to have
 * `caipChainId` field rather than a hex `chainId` field.
 * - Rebuilds `incomingTxLastFetchedBlockByChainId.smartTransactionsState.smartTransactions`
 * in SmartTransactionsController to be keyed by a caip chain ID rather than a hex chain ID.
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
              (_, chainId: string) => buildEthCaipChainId(chainId),
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
              buildEthCaipChainId(chainId),
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
        (_, chainId: string) => buildEthCaipChainId(chainId),
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
        (_, chainId: string) => buildEthCaipChainId(chainId),
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
        (_, chainId: string) => buildEthCaipChainId(chainId),
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
        (_, chainId: string) => buildEthCaipChainId(chainId),
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

      providerConfig.caipChainId = buildEthCaipChainId(
        providerConfig.chainId as string,
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
        (networkConfiguration: Record<string, unknown>) => {
          networkConfiguration.caipChainId = buildEthCaipChainId(
            networkConfiguration.chainId as string,
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
        (_, chainId: string) => buildEthCaipChainId(chainId),
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
      let { addressBook } = addressBookControllerState as {
        addressBook: Record<string, unknown>;
      };

      addressBook = mapKeys(addressBook, (_, chainId: string) =>
        buildEthCaipChainId(chainId),
      );

      addressBookControllerState.addressBook = mapValues(
        addressBook,
        (addressBookEntries: Record<string, unknown>) => {
          if (!isObject(addressBookEntries)) {
            return addressBookEntries;
          }

          return mapValues(
            addressBookEntries,
            (addressBookEntry: Record<string, unknown>) => {
              addressBookEntry.caipChainId = buildEthCaipChainId(
                addressBookEntry.chainId as string,
              );
              delete addressBookEntry.chainId;
              return addressBookEntry;
            },
          );
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
        (_, chainId: string) => buildEthCaipChainId(chainId),
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
        (transaction: Record<string, unknown>) => {
          transaction.caipChainId = buildEthCaipChainId(
            transaction.chainId as string,
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
          (_, chainId: string) => buildEthCaipChainId(chainId), // is this safe?
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
        (transaction: Record<string, unknown>) => {
          transaction.caipChainId = buildEthCaipChainId(
            transaction.chainId as string,
          ); // is this safe?
          delete transaction.chainId;

          if (
            hasProperty(transaction, 'history') &&
            Array.isArray(transaction.history)
          ) {
            const { history } = transaction;

            transaction.history = history.map((entry) => {
              if (isObject(entry) && hasProperty(entry, 'chainId')) {
                entry.caipChainId = buildEthCaipChainId(
                  entry.chainId as string,
                ); // is this safe?
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
        (transaction: Record<string, unknown>) => {
          transaction.caipChainId = buildEthCaipChainId(
            transaction.chainId as string,
          ); // is this safe?
          delete transaction.chainId;

          if (
            hasProperty(transaction, 'history') &&
            Array.isArray(transaction.history)
          ) {
            const { history } = transaction;

            transaction.history = history.map((entry) => {
              if (isObject(entry) && hasProperty(entry, 'chainId')) {
                entry.caipChainId = buildEthCaipChainId(
                  entry.chainId as string,
                ); // is this safe?
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
        (transaction: Record<string, unknown>) => {
          transaction.caipChainId = buildEthCaipChainId(
            transaction.chainId as string,
          ); // is this safe?
          delete transaction.chainId;

          if (
            hasProperty(transaction, 'history') &&
            Array.isArray(transaction.history)
          ) {
            const { history } = transaction;

            transaction.history = history.map((entry) => {
              if (isObject(entry) && hasProperty(entry, 'chainId')) {
                entry.caipChainId = buildEthCaipChainId(
                  entry.chainId as string,
                ); // is this safe?
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

  if (
    hasProperty(state, 'SmartTransactionsController') &&
    isObject(state.SmartTransactionsController)
  ) {
    const smartTransactionsControllerState = state.SmartTransactionsController;

    // Migrate SmartTransactionsController.smartTransactionsState.smartTransactions
    if (
      hasProperty(smartTransactionsControllerState, 'smartTransactionsState') &&
      isObject(smartTransactionsControllerState.smartTransactionsState) &&
      hasProperty(
        smartTransactionsControllerState.smartTransactionsState,
        'smartTransactions',
      ) &&
      isObject(
        smartTransactionsControllerState.smartTransactionsState
          .smartTransactions,
      )
    ) {
      const {
        smartTransactionsState: { smartTransactions },
      } = smartTransactionsControllerState;

      smartTransactionsControllerState.smartTransactionsState.smartTransactions =
        mapKeys(smartTransactions, (_, chainId: string) =>
          buildEthCaipChainId(chainId),
        );
    }

    state.SmartTransactionsController = smartTransactionsControllerState;
  }

  // What to do about MMI?
  // ui/selectors/institutional/selectors.test.js
}
||||||| 3b0d37c3b
=======
import { hasProperty, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';

export const version = 91;

/**
 * Delete network configurations if they do not have a chain id
 *
 * @param originalVersionedData - Versioned MetaMask extension state, exactly what we persist to dist.
 * @param originalVersionedData.meta - State metadata.
 * @param originalVersionedData.meta.version - The current state version.
 * @param originalVersionedData.data - The persisted MetaMask state, keyed by controller.
 * @returns Updated versioned MetaMask extension state.
 */
export async function migrate(originalVersionedData: {
  meta: { version: number };
  data: Record<string, unknown>;
}) {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;
  versionedData.data = transformState(versionedData.data);
  return versionedData;
}

function transformState(state: Record<string, unknown>) {
  if (
    hasProperty(state, 'NetworkController') &&
    isObject(state.NetworkController) &&
    hasProperty(state.NetworkController, 'networkConfigurations') &&
    isObject(state.NetworkController.networkConfigurations)
  ) {
    const { networkConfigurations } = state.NetworkController;

    for (const [networkConfigurationId, networkConfiguration] of Object.entries(
      networkConfigurations,
    )) {
      if (isObject(networkConfiguration)) {
        if (!networkConfiguration.chainId) {
          delete networkConfigurations[networkConfigurationId];
        }
      }
    }

    state.NetworkController = {
      ...state.NetworkController,
      networkConfigurations,
    };

    return {
      ...state,
      NetworkController: state.NetworkController,
    };
  }
  return state;
}
>>>>>>> develop
