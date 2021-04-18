import React from 'react';
import * as reactRedux from 'react-redux';
import { renderHook } from '@testing-library/react-hooks';
import sinon from 'sinon';
import { MemoryRouter } from 'react-router-dom';
import transactions from '../../../test/data/transaction-data.json';
import {
  getPreferences,
  getShouldShowFiat,
  getNativeCurrency,
  getCurrentCurrency,
  getCurrentChainId,
} from '../selectors';
import { getTokens } from '../ducks/metamask/metamask';
import { getMessage } from '../helpers/utils/i18n-helper';
import messages from '../../../app/_locales/en/messages.json';
import { ASSET_ROUTE, DEFAULT_ROUTE } from '../helpers/constants/routes';
import { MAINNET_CHAIN_ID } from '../../../shared/constants/network';
import {
  TRANSACTION_TYPES,
  TRANSACTION_GROUP_CATEGORIES,
  TRANSACTION_STATUSES,
} from '../../../shared/constants/transaction';
import * as i18nhooks from './useI18nContext';
import * as useTokenFiatAmountHooks from './useTokenFiatAmount';
import { useTransactionDisplayData } from './useTransactionDisplayData';

const expectedResults = [
  {
    title: 'Send',
    category: TRANSACTION_GROUP_CATEGORIES.SEND,
    subtitle: 'To: 0xffe5...1a97',
    subtitleContainsOrigin: false,
    date: 'May 12, 2020',
    primaryCurrency: '-1 ETH',
    senderAddress: '0x9eca64466f257793eaa52fcfff5066894b76a149',
    recipientAddress: '0xffe5bc4e8f1f969934d773fa67da095d2e491a97',
    secondaryCurrency: '-1 ETH',
    isPending: false,
    displayedStatusKey: TRANSACTION_STATUSES.CONFIRMED,
    isSubmitted: false,
  },
  {
    title: 'Send',
    category: TRANSACTION_GROUP_CATEGORIES.SEND,
    subtitle: 'To: 0x0ccc...8848',
    subtitleContainsOrigin: false,
    date: 'May 12, 2020',
    primaryCurrency: '-2 ETH',
    senderAddress: '0x9eca64466f257793eaa52fcfff5066894b76a149',
    recipientAddress: '0x0ccc8aeeaf5ce790f3b448325981a143fdef8848',
    secondaryCurrency: '-2 ETH',
    isPending: false,
    displayedStatusKey: TRANSACTION_STATUSES.CONFIRMED,
  },
  {
    title: 'Send',
    category: TRANSACTION_GROUP_CATEGORIES.SEND,
    subtitle: 'To: 0xffe5...1a97',
    subtitleContainsOrigin: false,
    date: 'May 12, 2020',
    primaryCurrency: '-2 ETH',
    senderAddress: '0x9eca64466f257793eaa52fcfff5066894b76a149',
    recipientAddress: '0xffe5bc4e8f1f969934d773fa67da095d2e491a97',
    secondaryCurrency: '-2 ETH',
    isPending: false,
    displayedStatusKey: TRANSACTION_STATUSES.CONFIRMED,
  },
  {
    title: 'Receive',
    category: TRANSACTION_GROUP_CATEGORIES.RECEIVE,
    subtitle: 'From: 0x31b9...4523',
    subtitleContainsOrigin: false,
    date: 'May 12, 2020',
    primaryCurrency: '18.75 ETH',
    senderAddress: '0x31b98d14007bdee637298086988a0bbd31184523',
    recipientAddress: '0x9eca64466f257793eaa52fcfff5066894b76a149',
    secondaryCurrency: '18.75 ETH',
    isPending: false,
    displayedStatusKey: TRANSACTION_STATUSES.CONFIRMED,
  },
  {
    title: 'Receive',
    category: TRANSACTION_GROUP_CATEGORIES.RECEIVE,
    subtitle: 'From: 0x9eca...a149',
    subtitleContainsOrigin: false,
    date: 'May 8, 2020',
    primaryCurrency: '0 ETH',
    senderAddress: '0x9eca64466f257793eaa52fcfff5066894b76a149',
    recipientAddress: '0x9eca64466f257793eaa52fcfff5066894b76a149',
    secondaryCurrency: '0 ETH',
    isPending: false,
    displayedStatusKey: TRANSACTION_STATUSES.CONFIRMED,
  },
  {
    title: 'Receive',
    category: TRANSACTION_GROUP_CATEGORIES.RECEIVE,
    subtitle: 'From: 0xee01...febb',
    subtitleContainsOrigin: false,
    date: 'May 24, 2020',
    primaryCurrency: '1 ETH',
    senderAddress: '0xee014609ef9e09776ac5fe00bdbfef57bcdefebb',
    recipientAddress: '0x9eca64466f257793eaa52fcfff5066894b76a149',
    secondaryCurrency: '1 ETH',
    isPending: false,
    displayedStatusKey: TRANSACTION_STATUSES.CONFIRMED,
  },
  {
    title: 'Swap ETH to ABC',
    category: TRANSACTION_TYPES.SWAP,
    subtitle: '',
    subtitleContainsOrigin: false,
    date: 'May 12, 2020',
    primaryCurrency: '+1 ABC',
    senderAddress: '0xee014609ef9e09776ac5fe00bdbfef57bcdefebb',
    recipientAddress: '0xabca64466f257793eaa52fcfff5066894b76a149',
    secondaryCurrency: undefined,
    isPending: false,
    displayedStatusKey: TRANSACTION_STATUSES.CONFIRMED,
  },
];

let useSelector, useI18nContext, useTokenFiatAmount;

const renderHookWithRouter = (cb, tokenAddress) => {
  const initialEntries = [
    tokenAddress ? `${ASSET_ROUTE}/${tokenAddress}` : DEFAULT_ROUTE,
  ];
  const wrapper = ({ children }) => (
    <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
  );
  return renderHook(cb, { wrapper });
};

describe('useTransactionDisplayData', () => {
  beforeAll(() => {
    useSelector = sinon.stub(reactRedux, 'useSelector');
    useTokenFiatAmount = sinon.stub(
      useTokenFiatAmountHooks,
      'useTokenFiatAmount',
    );
    useTokenFiatAmount.returns((tokenAddress) => {
      return tokenAddress ? '1 TST' : undefined;
    });
    useI18nContext = sinon.stub(i18nhooks, 'useI18nContext');
    useI18nContext.returns((key, variables) =>
      getMessage('en', messages, key, variables),
    );
    useSelector.callsFake((selector) => {
      if (selector === getTokens) {
        return [
          {
            address: '0xabca64466f257793eaa52fcfff5066894b76a149',
            symbol: 'ABC',
            decimals: 18,
          },
        ];
      } else if (selector === getPreferences) {
        return {
          useNativeCurrencyAsPrimaryCurrency: true,
        };
      } else if (selector === getShouldShowFiat) {
        return false;
      } else if (selector === getNativeCurrency) {
        return 'ETH';
      } else if (selector === getCurrentCurrency) {
        return 'ETH';
      } else if (selector === getCurrentChainId) {
        return MAINNET_CHAIN_ID;
      }
      return null;
    });
  });

  afterAll(() => {
    sinon.restore();
  });

  transactions.forEach((transactionGroup, idx) => {
    describe(`when called with group containing primaryTransaction id ${transactionGroup.primaryTransaction.id}`, () => {
      const expected = expectedResults[idx];
      const tokenAddress =
        transactionGroup.primaryTransaction?.destinationTokenAddress;
      it(`should return a title of ${expected.title}`, () => {
        const { result } = renderHookWithRouter(
          () => useTransactionDisplayData(transactionGroup),
          tokenAddress,
        );
        expect(result.current.title).toStrictEqual(expected.title);
      });
      it(`should return a subtitle of ${expected.subtitle}`, () => {
        const { result } = renderHookWithRouter(
          () => useTransactionDisplayData(transactionGroup),
          tokenAddress,
        );
        expect(result.current.subtitle).toStrictEqual(expected.subtitle);
      });
      it(`should return a category of ${expected.category}`, () => {
        const { result } = renderHookWithRouter(
          () => useTransactionDisplayData(transactionGroup),
          tokenAddress,
        );
        expect(result.current.category).toStrictEqual(expected.category);
      });
      it(`should return a primaryCurrency of ${expected.primaryCurrency}`, () => {
        const { result } = renderHookWithRouter(
          () => useTransactionDisplayData(transactionGroup),
          tokenAddress,
        );
        expect(result.current.primaryCurrency).toStrictEqual(
          expected.primaryCurrency,
        );
      });
      it(`should return a secondaryCurrency of ${expected.secondaryCurrency}`, () => {
        const { result } = renderHookWithRouter(
          () => useTransactionDisplayData(transactionGroup),
          tokenAddress,
        );
        expect(result.current.secondaryCurrency).toStrictEqual(
          expected.secondaryCurrency,
        );
      });
      it(`should return a displayedStatusKey of ${expected.displayedStatusKey}`, () => {
        const { result } = renderHookWithRouter(
          () => useTransactionDisplayData(transactionGroup),
          tokenAddress,
        );
        expect(result.current.displayedStatusKey).toStrictEqual(
          expected.displayedStatusKey,
        );
      });
      it(`should return a recipientAddress of ${expected.recipientAddress}`, () => {
        const { result } = renderHookWithRouter(
          () => useTransactionDisplayData(transactionGroup),
          tokenAddress,
        );
        expect(result.current.recipientAddress).toStrictEqual(
          expected.recipientAddress,
        );
      });
      it(`should return a senderAddress of ${expected.senderAddress}`, () => {
        const { result } = renderHookWithRouter(
          () => useTransactionDisplayData(transactionGroup),
          tokenAddress,
        );
        expect(result.current.senderAddress).toStrictEqual(
          expected.senderAddress,
        );
      });
    });
  });
  it('should return an appropriate object', () => {
    const { result } = renderHookWithRouter(() =>
      useTransactionDisplayData(transactions[0]),
    );
    expect(result.current).toStrictEqual(expectedResults[0]);
  });
});
