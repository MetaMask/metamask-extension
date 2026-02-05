import { createSelector } from 'reselect';
import {
  TransactionStatus,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { selectedAddressTxListSelectorAllChain } from './transactions';
import { getMarketData, getCurrencyRates } from './selectors';

export const getPendingTransactions = createSelector(
  selectedAddressTxListSelectorAllChain,
  (allTxs) => {
    return (allTxs as TransactionMeta[])
      .filter((tx) => {
        const isSubmitted = tx.status === TransactionStatus.submitted;
        const isConfirmed = tx.status === TransactionStatus.confirmed;
        const isFailed = tx.status === TransactionStatus.failed;
        return isSubmitted || isConfirmed || isFailed;
      })
      .map((tx) => {
        // Map to V1TransactionByHashResponse transactionType
        let transactionType;
        if (tx.type === 'transfer') {
          transactionType = 'ERC_20_TRANSFER';
        } else if (tx.type === 'approve') {
          transactionType = 'ERC_20_APPROVE';
        } else if (tx.type === 'swap') {
          transactionType = 'METAMASK_V1_EXCHANGE';
        }

        // Extract values
        let valueTransfers;

        if (tx.type === 'transfer') {
          if (
            tx.simulationData?.tokenBalanceChanges &&
            tx.simulationData?.tokenBalanceChanges?.length > 0
          ) {
            let decimal: number | undefined;
            let symbol: string | undefined;

            const tokenChange = tx.simulationData.tokenBalanceChanges[0];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const gasFeeToken = (tx.gasFeeTokens as any)?.find(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (token: any) =>
                token.tokenAddress?.toLowerCase() ===
                tokenChange.address?.toLowerCase(),
            );

            if (gasFeeToken) {
              decimal = gasFeeToken.decimals;
              symbol = gasFeeToken.symbol;
            }

            valueTransfers = [
              {
                amount: String(parseInt(tokenChange.difference || '0x0', 16)),
                decimal,
                symbol: symbol || '',
                from: tx.txParams.from || '',
                to: tx.txParams.to || '',
                contractAddress: tokenChange.address || tx.txParams.to || '',
              },
            ];
          }
        }

        return {
          hash: tx.hash || '',
          timestamp: new Date(tx.time || Date.now()).toISOString(), // Match V1TransactionByHashResponse
          chainId: parseInt(tx.chainId, 16), // Match V1TransactionByHashResponse
          value: tx.txParams.value || '0x0',
          to: tx.txParams.to || '',
          from: tx.txParams.from || '',
          isError: tx.status === TransactionStatus.failed,
          transactionType,
          valueTransfers,
          pendingTransactionMeta: tx, // For the PendingTransactionActions
        };
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
