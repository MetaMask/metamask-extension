import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { CHAIN_IDS } from '../../shared/constants/network';
import { mockNetworkState } from '../../test/stub/networks';
import {
  conversionRateSelector,
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
});
