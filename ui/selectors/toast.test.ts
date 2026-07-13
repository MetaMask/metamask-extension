import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import type { MetaMaskReduxState as SelectorState } from '../store/store';
import { selectPerpsWithdrawTransactionsForToast } from './toast';

describe('toast selectors', () => {
  describe('selectPerpsWithdrawTransactionsForToast', () => {
    it('returns perps withdraw transactions with post-quote toast data', () => {
      const state = {
        metamask: {
          transactions: [
            { id: '0', time: 1, type: TransactionType.simpleSend },
            {
              id: '1',
              time: 2,
              type: TransactionType.perpsWithdraw,
              status: TransactionStatus.confirmed,
              metamaskPay: {
                isPostQuote: true,
                targetFiat: '20.73',
                chainId: '0x38',
                tokenAddress: '0xtoken',
              },
            },
          ],
          allTokens: {
            '0x38': {
              '0xabc': [{ address: '0xtoken', symbol: 'BNB' }],
            },
          },
          networkConfigurationsByChainId: {
            '0x38': { nativeCurrency: 'BNB' },
          },
        },
      } as unknown as SelectorState;

      const results = selectPerpsWithdrawTransactionsForToast(state);

      expect(results).toStrictEqual([
        {
          id: '1',
          isPostQuote: true,
          status: TransactionStatus.confirmed,
          targetFiat: 20.73,
          tokenSymbol: 'BNB',
        },
      ]);
    });

    it('falls back to the network ticker when the token is not imported', () => {
      const state = {
        metamask: {
          transactions: [
            {
              id: '1',
              time: 2,
              type: TransactionType.perpsWithdraw,
              status: TransactionStatus.confirmed,
              metamaskPay: {
                isPostQuote: true,
                targetFiat: '1.50',
                chainId: '0x1',
                tokenAddress: '0xunknown',
              },
            },
          ],
          allTokens: {},
          networkConfigurationsByChainId: {
            '0x1': { nativeCurrency: 'ETH' },
          },
        },
      } as unknown as SelectorState;

      const results = selectPerpsWithdrawTransactionsForToast(state);

      expect(results).toStrictEqual([
        {
          id: '1',
          isPostQuote: true,
          status: TransactionStatus.confirmed,
          targetFiat: 1.5,
          tokenSymbol: 'ETH',
        },
      ]);
    });

    it('returns generic USDC data when post-quote metadata is missing', () => {
      const state = {
        metamask: {
          transactions: [
            {
              id: '1',
              time: 2,
              type: TransactionType.perpsWithdraw,
              status: TransactionStatus.failed,
            },
          ],
        },
      } as unknown as SelectorState;

      const results = selectPerpsWithdrawTransactionsForToast(state);

      expect(results).toStrictEqual([
        {
          id: '1',
          isPostQuote: false,
          status: TransactionStatus.failed,
          tokenSymbol: 'USDC',
        },
      ]);
    });

    it('includes transactions with nested perps withdraw metadata', () => {
      const state = {
        metamask: {
          transactions: [
            {
              id: '1',
              time: 2,
              type: TransactionType.simpleSend,
              nestedTransactions: [{ type: TransactionType.perpsWithdraw }],
              status: TransactionStatus.approved,
            },
          ],
        },
      } as unknown as SelectorState;

      const results = selectPerpsWithdrawTransactionsForToast(state);

      expect(results).toStrictEqual([
        {
          id: '1',
          isPostQuote: false,
          status: TransactionStatus.approved,
          tokenSymbol: 'USDC',
        },
      ]);
    });
  });
});
