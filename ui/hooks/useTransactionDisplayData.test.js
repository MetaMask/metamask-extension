import React from 'react';
import * as reactRedux from 'react-redux';
import { Provider } from 'react-redux';
import { renderHook } from '@testing-library/react-hooks';
import sinon from 'sinon';
import { MemoryRouter } from 'react-router-dom';
import mockState from '../../test/data/mock-state.json';
import configureStore from '../store/store';
import transactions from '../../test/data/transaction-data.json';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import messages from '../../app/_locales/en/messages.json';
import { ASSET_ROUTE, DEFAULT_ROUTE } from '../helpers/constants/routes';
import { KeyringType } from '../../shared/constants/keyring';
import { createMockInternalAccount } from '../../test/jest/mocks';
import { getMessage } from '../helpers/utils/i18n-helper';
import { mockNetworkState } from '../../test/stub/networks';
import { CHAIN_IDS } from '../../shared/constants/network';
import * as i18nhooks from './useI18nContext';
import * as useTokenFiatAmountHooks from './useTokenFiatAmount';
import { useTransactionDisplayData } from './useTransactionDisplayData';

const expectedResults = [
  {
    title: 'Sent',
    primaryCurrency: '-1 ETH',
    recipientAddress: '0xffe5bc4e8f1f969934d773fa67da095d2e491a97',
    secondaryCurrency: '-1 ETH',
    isPending: false,
  },
  {
    title: 'Sent',
    primaryCurrency: '-2 ETH',
    recipientAddress: '0x0ccc8aeeaf5ce790f3b448325981a143fdef8848',
    secondaryCurrency: '-2 ETH',
    isPending: false,
  },
  {
    title: 'Sent',
    primaryCurrency: '-2 ETH',
    recipientAddress: '0xffe5bc4e8f1f969934d773fa67da095d2e491a97',
    secondaryCurrency: '-2 ETH',
    isPending: false,
  },
  {
    title: 'Received',
    primaryCurrency: '18.75 ETH',
    recipientAddress: '0x9eca64466f257793eaa52fcfff5066894b76a149',
    secondaryCurrency: '18.75 ETH',
    isPending: false,
  },
  {
    title: 'Received',
    primaryCurrency: '0 ETH',
    recipientAddress: '0x9eca64466f257793eaa52fcfff5066894b76a149',
    secondaryCurrency: '0 ETH',
    isPending: false,
  },
  {
    title: 'Received',
    primaryCurrency: '1 ETH',
    recipientAddress: '0x9eca64466f257793eaa52fcfff5066894b76a149',
    secondaryCurrency: '1 ETH',
    isPending: false,
  },
  {
    title: 'Swap ETH to ABC',
    primaryCurrency: '+1 ABC',
    recipientAddress: '0xabca64466f257793eaa52fcfff5066894b76a149',
    isPending: false,
  },
  {
    title: 'Contract deployment',
    primaryCurrency: '-0 ETH',
    recipientAddress: undefined,
    secondaryCurrency: '-0 ETH',
    isPending: false,
  },
  {
    title: 'Safe transfer from',
    primaryCurrency: '-0 ETH',
    recipientAddress: '0xe7d522230eff653bb0a9b4385f0be0815420dd98',
    secondaryCurrency: '-0 ETH',
    isPending: false,
  },
  {
    title: 'Approve ABC spending cap',
    primaryCurrency: '0.00000000000005 ABC',
    recipientAddress: '0xabca64466f257793eaa52fcfff5066894b76a149',
    secondaryCurrency: undefined,
    isPending: false,
  },
  {
    title: 'Sent BAT as ETH',
    primaryCurrency: '-33.425656732428330864 BAT',
    recipientAddress: '0xc6f6ca03d790168758285264bcbf7fb30d27322b',
    secondaryCurrency: undefined,
    isPending: false,
  },
  {
    title: 'Sent USDC as DAI',
    primaryCurrency: '-5 USDC',
    recipientAddress: '0x141d32a89a1e0a5ef360034a2f60a4b917c18838',
    secondaryCurrency: undefined,
    isPending: false,
  },
  {
    title: 'Sent BNB as USDC',
    primaryCurrency: '-0.05 BNB',
    recipientAddress: '0x141d32a89a1e0a5ef360034a2f60a4b917c18838',
    secondaryCurrency: undefined,
    isPending: false,
  },
  {
    title: 'Sent ABC',
    primaryCurrency: '-1.234 ABC',
    recipientAddress: '0xabca64466f257793eaa52fcfff5066894b76a149',
    secondaryCurrency: undefined,
    isPending: false,
  },
];

let useI18nContext, useTokenFiatAmount;
const ADDRESS_MOCK = '0xabc';
const NAME_MOCK = 'Account 1';

const MOCK_INTERNAL_ACCOUNT = createMockInternalAccount({
  address: ADDRESS_MOCK,
  name: NAME_MOCK,
  keyringType: KeyringType.hd,
  snapOptions: undefined,
});

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
        getShowFiatInTestnets: false,
      },
      allNfts: [],
      internalAccounts: {
        accounts: { [MOCK_INTERNAL_ACCOUNT.id]: MOCK_INTERNAL_ACCOUNT },
        selectedAccount: MOCK_INTERNAL_ACCOUNT.id,
      },
      allTokens: {
        [CHAIN_IDS.MAINNET]: {
          [ADDRESS_MOCK]: [
            {
              address: '0xabca64466f257793eaa52fcfff5066894b76a149',
              symbol: 'ABC',
              decimals: 18,
            },
          ],
        },
      },
      allDetectedTokens: {
        [CHAIN_IDS.MAINNET]: [
          {
            [ADDRESS_MOCK]: [
              {
                address: '0xabca64466f257793eaa52fcfff5066894b76a149',
                symbol: 'ABC',
                decimals: 18,
              },
            ],
          },
        ],
      },
      tokensChainsCache: {
        '0x4': {
          data: {
            '0xabca64466f257793eaa52fcfff5066894b76a149': {
              address: '0xabca64466f257793eaa52fcfff5066894b76a149',
              symbol: 'ABC',
              decimals: 18,
            },
          },
        },
      },
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

      it(`should return a primaryCurrency of ${expected.primaryCurrency}`, () => {
        const { result } = renderHookWithRouter(
          () => useTransactionDisplayData(transactionGroup),
          tokenAddress,
        );
        expect(result.current.primaryCurrency).toStrictEqual(
          expected.primaryCurrency,
        );
      });

      it(`should return a secondaryCurrency of ${expected.secondaryCurrency} for ${transactionGroup.primaryTransaction.type}`, () => {
        const { result } = renderHookWithRouter(
          () => useTransactionDisplayData(transactionGroup),
          tokenAddress,
        );
        expect(result.current.secondaryCurrency).toStrictEqual(
          expected.secondaryCurrency,
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
    });
  });

  it('should return an appropriate object', () => {
    const { result } = renderHookWithRouter(() =>
      useTransactionDisplayData(transactions[0]),
    );
    expect(result.current).toStrictEqual(expectedResults[0]);
  });
});
