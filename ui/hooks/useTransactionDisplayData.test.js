import React from 'react';
import * as reactRedux from 'react-redux';
import { Provider } from 'react-redux';
import { renderHook } from '@testing-library/react-hooks';
import sinon from 'sinon';
import { MemoryRouter } from 'react-router-dom';
import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import mockState from '../../test/data/mock-state.json';
import configureStore from '../store/store';
import transactions from '../../test/data/transaction-data.json';
import messages from '../../app/_locales/en/messages.json';
import { ASSET_ROUTE, DEFAULT_ROUTE } from '../helpers/constants/routes';
import { TransactionGroupCategory } from '../../shared/constants/transaction';
import { formatDateWithYearContext } from '../helpers/utils/util';
import { getMessage } from '../helpers/utils/i18n-helper';
import { mockNetworkState } from '../../test/stub/networks';
import { CHAIN_IDS } from '../../shared/constants/network';
import * as i18nhooks from './useI18nContext';
import * as useTokenFiatAmountHooks from './useTokenFiatAmount';
import { useTransactionDisplayData } from './useTransactionDisplayData';

const expectedResults = [
  {
    title: 'Send',
    category: TransactionGroupCategory.send,
    subtitle: 'To: 0xffe5b...91a97',
    subtitleContainsOrigin: false,
    date: formatDateWithYearContext(1589314601567),
    primaryCurrency: '-1 ETH',
    senderAddress: '0x9eca64466f257793eaa52fcfff5066894b76a149',
    recipientAddress: '0xffe5bc4e8f1f969934d773fa67da095d2e491a97',
    secondaryCurrency: '-1 ETH',
    isPending: false,
    displayedStatusKey: TransactionStatus.confirmed,
    isSubmitted: false,
  },
  {
    title: 'Send',
    category: TransactionGroupCategory.send,
    subtitle: 'To: 0x0ccc8...f8848',
    subtitleContainsOrigin: false,
    date: formatDateWithYearContext(1589314355872),
    primaryCurrency: '-2 ETH',
    senderAddress: '0x9eca64466f257793eaa52fcfff5066894b76a149',
    recipientAddress: '0x0ccc8aeeaf5ce790f3b448325981a143fdef8848',
    secondaryCurrency: '-2 ETH',
    isPending: false,
    displayedStatusKey: TransactionStatus.confirmed,
  },
  {
    title: 'Send',
    category: TransactionGroupCategory.send,
    subtitle: 'To: 0xffe5b...91a97',
    subtitleContainsOrigin: false,
    date: formatDateWithYearContext(1589314345433),
    primaryCurrency: '-2 ETH',
    senderAddress: '0x9eca64466f257793eaa52fcfff5066894b76a149',
    recipientAddress: '0xffe5bc4e8f1f969934d773fa67da095d2e491a97',
    secondaryCurrency: '-2 ETH',
    isPending: false,
    displayedStatusKey: TransactionStatus.confirmed,
  },
  {
    title: 'Receive',
    category: TransactionGroupCategory.receive,
    subtitle: 'From: 0x31b98...84523',
    subtitleContainsOrigin: false,
    date: formatDateWithYearContext(1589314295000),
    primaryCurrency: '18.75 ETH',
    senderAddress: '0x31b98d14007bdee637298086988a0bbd31184523',
    recipientAddress: '0x9eca64466f257793eaa52fcfff5066894b76a149',
    secondaryCurrency: '18.75 ETH',
    isPending: false,
    displayedStatusKey: TransactionStatus.confirmed,
  },
  {
    title: 'Receive',
    category: TransactionGroupCategory.receive,
    subtitle: 'From: 0x9eca6...6a149',
    subtitleContainsOrigin: false,
    date: formatDateWithYearContext(1588972833000),
    primaryCurrency: '0 ETH',
    senderAddress: '0x9eca64466f257793eaa52fcfff5066894b76a149',
    recipientAddress: '0x9eca64466f257793eaa52fcfff5066894b76a149',
    secondaryCurrency: '0 ETH',
    isPending: false,
    displayedStatusKey: TransactionStatus.confirmed,
  },
  {
    title: 'Receive',
    category: TransactionGroupCategory.receive,
    subtitle: 'From: 0xee014...efebb',
    subtitleContainsOrigin: false,
    date: formatDateWithYearContext(1585087013000),
    primaryCurrency: '1 ETH',
    senderAddress: '0xee014609ef9e09776ac5fe00bdbfef57bcdefebb',
    recipientAddress: '0x9eca64466f257793eaa52fcfff5066894b76a149',
    secondaryCurrency: '1 ETH',
    isPending: false,
    displayedStatusKey: TransactionStatus.confirmed,
  },
  {
    title: 'Swap ETH to ABC',
    category: TransactionType.swap,
    subtitle: '',
    subtitleContainsOrigin: false,
    date: formatDateWithYearContext(1585088013000),
    primaryCurrency: '+1 ABC',
    senderAddress: '0xee014609ef9e09776ac5fe00bdbfef57bcdefebb',
    recipientAddress: '0xabca64466f257793eaa52fcfff5066894b76a149',
    secondaryCurrency: undefined,
    isPending: false,
    displayedStatusKey: TransactionStatus.confirmed,
  },
  {
    title: 'Contract deployment',
    category: TransactionGroupCategory.interaction,
    subtitle: 'metamask.github.io',
    subtitleContainsOrigin: true,
    date: formatDateWithYearContext(1585088013000),
    primaryCurrency: '-0 ETH',
    senderAddress: '0xee014609ef9e09776ac5fe00bdbfef57bcdefebb',
    recipientAddress: undefined,
    secondaryCurrency: '-0 ETH',
    isPending: false,
    displayedStatusKey: TransactionStatus.confirmed,
  },
  {
    title: 'Safe transfer from',
    category: TransactionGroupCategory.send,
    subtitle: 'To: 0xe7d52...0dd98',
    subtitleContainsOrigin: true,
    primaryCurrency: '-0 ETH',
    senderAddress: '0x806627172af48bd5b0765d3449a7def80d6576ff',
    recipientAddress: '0xe7d522230eff653bb0a9b4385f0be0815420dd98',
    secondaryCurrency: '-0 ETH',
    isPending: false,
    displayedStatusKey: TransactionStatus.confirmed,
  },
  {
    title: 'Approve ABC spending cap',
    category: TransactionGroupCategory.approval,
    subtitle: `metamask.github.io`,
    subtitleContainsOrigin: true,
    primaryCurrency: '0.00000000000005 ABC',
    senderAddress: '0xe18035bf8712672935fdb4e5e431b1a0183d2dfc',
    recipientAddress: '0xabca64466f257793eaa52fcfff5066894b76a149',
    secondaryCurrency: undefined,
    displayedStatusKey: TransactionStatus.confirmed,
    isPending: false,
  },
  {
    title: 'Send BAT as ETH',
    category: TransactionType.swapAndSend,
    subtitle: 'metamask',
    subtitleContainsOrigin: true,
    date: formatDateWithYearContext(1585088013000),
    primaryCurrency: '-33.425656732428330864 BAT',
    senderAddress: '0x0a985a957b490f4d05bef05bc7ec556dd8535946',
    recipientAddress: '0xc6f6ca03d790168758285264bcbf7fb30d27322b',
    secondaryCurrency: undefined,
    isPending: false,
    displayedStatusKey: TransactionStatus.confirmed,
  },
  {
    title: 'Send USDC as DAI',
    category: TransactionType.swapAndSend,
    subtitle: 'metamask',
    subtitleContainsOrigin: true,
    date: formatDateWithYearContext(1585088013000),
    primaryCurrency: '-5 USDC',
    senderAddress: '0x141d32a89a1e0a5ef360034a2f60a4b917c18838',
    recipientAddress: '0x141d32a89a1e0a5ef360034a2f60a4b917c18838',
    secondaryCurrency: undefined,
    isPending: false,
    displayedStatusKey: TransactionStatus.confirmed,
  },
  {
    title: 'Send BNB as USDC',
    category: TransactionType.swapAndSend,
    subtitle: 'metamask',
    subtitleContainsOrigin: true,
    date: formatDateWithYearContext(1585088013000),
    primaryCurrency: '-0.05 BNB',
    senderAddress: '0x141d32a89a1e0a5ef360034a2f60a4b917c18838',
    recipientAddress: '0x141d32a89a1e0a5ef360034a2f60a4b917c18838',
    secondaryCurrency: undefined,
    isPending: false,
    displayedStatusKey: TransactionStatus.confirmed,
  },
];

let useI18nContext, useTokenFiatAmount;

const renderHookWithRouter = (cb, tokenAddress) => {
  const initialEntries = [
    tokenAddress ? `${ASSET_ROUTE}/${tokenAddress}` : DEFAULT_ROUTE,
  ];

  const defaultState = {
    ...mockState,
    metamask: {
      ...mockState.metamask,
      completeOnboarding: true,
      ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
      currentCurrency: 'ETH',
      useCurrencyRateCheck: false, // to force getShouldShowFiat to return false
      preferences: {
        useNativeCurrencyAsPrimaryCurrency: true,
        getShowFiatInTestnets: false,
      },
      allNfts: [],
      tokens: [
        {
          address: '0xabca64466f257793eaa52fcfff5066894b76a149',
          symbol: 'ABC',
          decimals: 18,
        },
      ],
    },
  };

  const wrapper = ({ children }) => (
    <MemoryRouter initialEntries={initialEntries}>
      <Provider store={configureStore(defaultState)}>{children}</Provider>
    </MemoryRouter>
  );
  return renderHook(cb, { wrapper });
};

describe('useTransactionDisplayData', () => {
  const dispatch = sinon.spy();

  beforeAll(() => {
    useTokenFiatAmount = sinon.stub(
      useTokenFiatAmountHooks,
      'useTokenFiatAmount',
    );
    useTokenFiatAmount.returns(undefined);
    useI18nContext = sinon.stub(i18nhooks, 'useI18nContext');
    useI18nContext.returns((key, variables) =>
      getMessage('en', messages, key, variables),
    );
    sinon.stub(reactRedux, 'useDispatch').returns(dispatch);
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
