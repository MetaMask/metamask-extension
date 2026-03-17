import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { NetworkStatus } from '@metamask/network-controller';
import { CHAIN_IDS } from '../../shared/constants/network';
import { GasEstimateTypes } from '../../shared/constants/gas';
import { mockNetworkState } from '../../test/stub/networks';
import {
  conversionRateSelector,
  transactionFeeSelector,
  unconfirmedTransactionsHashSelector,
} from './confirm-transaction';

describe('Confirm Transaction Selector', () => {
  describe('conversionRateSelector', () => {
    it('returns conversionRate from state', () => {
      const state = {
        metamask: {
          currencyRates: {
            ETH: {
              conversionRate: 556.12,
            },
          },
          ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
        },
      };
      expect(conversionRateSelector(state)).toStrictEqual(556.12);
    });
  });

  describe('unconfirmedTransactionsHashSelector', () => {
    it('returns transactions from all networks', () => {
      const state = {
        metamask: {
          transactions: [
            {
              id: 1,
              chainId: '0x1',
              status: TransactionStatus.unapproved,
              type: TransactionType.incoming,
              txParams: { to: '0xSelectedAddress' },
            },
            {
              id: 2,
              chainId: '0x2',
              status: TransactionStatus.unapproved,
              type: TransactionType.incoming,
              txParams: { to: '0xOtherAddress' },
            },
            {
              id: 3,
              chainId: '0x3',
              status: TransactionStatus.unapproved,
              type: TransactionType.outgoing,
              txParams: { to: '0xSelectedAddress' },
            },
            {
              id: 4,
              chainId: '0x1',
              status: TransactionStatus.unapproved,
              type: TransactionType.incoming,
              txParams: { to: '0xSelectedAddress' },
            },
          ],
        },
      };
      expect(unconfirmedTransactionsHashSelector(state)).toStrictEqual({
        1: state.metamask.transactions[0],
        2: state.metamask.transactions[1],
        3: state.metamask.transactions[2],
        4: state.metamask.transactions[3],
      });
    });
  });

  describe('transactionFeeSelector', () => {
    const baseTxData = {
      txParams: { gas: '0x5208', value: '0x0' },
      userFeeLevel: 'medium',
    };

    it('uses transaction chain gas when txData.chainId is set and chain has networkClientId', () => {
      const networkState = mockNetworkState(
        {
          chainId: CHAIN_IDS.MAINNET,
          metadata: { EIPS: { 1559: true }, status: NetworkStatus.Available },
        },
        {
          chainId: CHAIN_IDS.BASE,
          metadata: { EIPS: { 1559: true }, status: NetworkStatus.Available },
        },
      );
      const selectedChainGasHigh = {
        estimatedBaseFee: '100',
        high: {
          suggestedMaxFeePerGas: '200',
          suggestedMaxPriorityFeePerGas: '10',
        },
        medium: {
          suggestedMaxFeePerGas: '150',
          suggestedMaxPriorityFeePerGas: '8',
        },
        low: {
          suggestedMaxFeePerGas: '120',
          suggestedMaxPriorityFeePerGas: '5',
        },
      };
      const transactionChainGasLow = {
        estimatedBaseFee: '1',
        high: {
          suggestedMaxFeePerGas: '2',
          suggestedMaxPriorityFeePerGas: '1',
        },
        medium: {
          suggestedMaxFeePerGas: '2',
          suggestedMaxPriorityFeePerGas: '1',
        },
        low: {
          suggestedMaxFeePerGas: '1',
          suggestedMaxPriorityFeePerGas: '1',
        },
      };
      const state = {
        metamask: {
          ...networkState,
          gasFeeEstimates: selectedChainGasHigh,
          gasEstimateType: GasEstimateTypes.feeMarket,
          gasFeeEstimatesByChainId: {
            [CHAIN_IDS.BASE]: {
              gasFeeEstimates: transactionChainGasLow,
              gasEstimateType: GasEstimateTypes.feeMarket,
            },
          },
          currencyRates: { ETH: { conversionRate: 1 } },
          currentCurrency: 'usd',
        },
      };

      const feeWithTransactionChain = transactionFeeSelector(state, {
        ...baseTxData,
        chainId: CHAIN_IDS.BASE,
      });
      const feeWithSelectedChainOnly = transactionFeeSelector(state, {
        ...baseTxData,
        chainId: undefined,
      });

      expect(
        BigInt(feeWithTransactionChain.hexMaximumTransactionFee),
      ).toBeLessThan(BigInt(feeWithSelectedChainOnly.hexMaximumTransactionFee));
    });

    it('uses selected chain gas when txData has no chainId', () => {
      const networkState = mockNetworkState({
        chainId: CHAIN_IDS.MAINNET,
        metadata: { EIPS: { 1559: true }, status: NetworkStatus.Available },
      });
      const gasEstimates = {
        estimatedBaseFee: '50',
        medium: {
          suggestedMaxFeePerGas: '100',
          suggestedMaxPriorityFeePerGas: '5',
        },
      };
      const state = {
        metamask: {
          ...networkState,
          gasFeeEstimates: gasEstimates,
          gasEstimateType: GasEstimateTypes.feeMarket,
          currencyRates: { ETH: { conversionRate: 1 } },
          currentCurrency: 'usd',
        },
      };

      const result = transactionFeeSelector(state, baseTxData);
      expect(result.hexMaximumTransactionFee).toBeDefined();
      expect(result.hexMinimumTransactionFee).toBeDefined();
    });
  });
});
