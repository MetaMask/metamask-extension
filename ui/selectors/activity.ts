import { createSelector } from 'reselect';
import {
  TransactionStatus,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { selectedAddressTxListSelectorAllChain } from './transactions';
import {
  getMarketData,
  getCurrencyRates,
  getEnabledNetworks,
} from './selectors';
import { getSelectedAccountGroupMultichainTransactions } from './multichain-transactions';

export const getPendingTransactions = createSelector(
  selectedAddressTxListSelectorAllChain,
  (allTxs) => {
    return (allTxs as TransactionMeta[]).filter((tx) => {
      const isSubmitted = tx.status === TransactionStatus.submitted;
      const isConfirmed = tx.status === TransactionStatus.confirmed;
      const isFailed = tx.status === TransactionStatus.failed;
      return isSubmitted || isConfirmed || isFailed;
    });
  },
);

export const getMarketRates = createSelector(
  [getMarketData, getCurrencyRates],
  (marketData, currencyRates) => {
    const rates: Record<number, Record<string, number>> = {};

    // Build lookup table: [chainId][tokenAddress] -> USD rate
    for (const [hexChainId, chainData] of Object.entries(
      marketData as Record<string, Record<string, { price: number }>>,
    )) {
      const chainId = parseInt(hexChainId, 16);
      rates[chainId] = {};

      for (const [tokenAddress, tokenData] of Object.entries(chainData)) {
        // Get native currency conversion rate (ETH -> USD)
        const conversionRate = currencyRates?.ETH?.conversionRate;

        if (tokenData.price && conversionRate) {
          // Token price is in native currency, multiply by conversion rate to get USD
          rates[chainId][tokenAddress.toLowerCase()] =
            tokenData.price * conversionRate;
        }
      }
    }

    return rates;
  },
);

/**
 * Gets all non-EVM chain IDs from enabled networks
 */
export const getNonEvmChainIds = createSelector(
  [getEnabledNetworks],
  (enabledNetworks) => {
    const allNamespaces = Object.keys(enabledNetworks);
    const nonEvmNamespaces = allNamespaces.filter((ns) => ns !== 'eip155');

    const chainIds = nonEvmNamespaces.flatMap((namespace) =>
      Object.keys(enabledNetworks[namespace] as Record<string, unknown>),
    );

    return [...new Set(chainIds)];
  },
);

/**
 * Gets non-EVM transactions for the selected account group.
 *
 * @param state - The Redux state.
 * @returns The non-EVM transactions for the selected account group.
 */
export const getNonEvmTransactions = createSelector(
  [(state) => state, getNonEvmChainIds],
  (state, nonEvmChainIds) => {
    return getSelectedAccountGroupMultichainTransactions(state, nonEvmChainIds);
  },
);
