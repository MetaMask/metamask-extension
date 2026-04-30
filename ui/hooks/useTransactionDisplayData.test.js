import * as reactRedux from 'react-redux';
import sinon from 'sinon';
import mockState from '../../test/data/mock-state.json';
import transactions from '../../test/data/transaction-data.json';
import { enLocale as messages } from '../../test/lib/i18n-helpers';
import { ASSET_ROUTE, DEFAULT_ROUTE } from '../helpers/constants/routes';
import { KeyringType } from '../../shared/constants/keyring';
import { createMockInternalAccount } from '../../test/jest/mocks';
import { getMessage } from '../helpers/utils/i18n-helper';
import { mockNetworkState } from '../../test/stub/networks';
import { CHAIN_IDS } from '../../shared/constants/network';
import { renderHookWithProvider } from '../../test/lib/render-helpers-navigate';
import { MERKL_DISTRIBUTOR_ADDRESS } from '../components/app/musd/constants';
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

const getMockState = () => ({
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
});

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
      const pathname = tokenAddress
        ? `${ASSET_ROUTE}/${tokenAddress}`
        : DEFAULT_ROUTE;

      it(`should return a title of ${expected.title}`, () => {
        const { result } = renderHookWithProvider(
          () => useTransactionDisplayData(transactionGroup),
          getMockState(),
          pathname,
        );
        expect(result.current.title).toStrictEqual(expected.title);
      });

      it(`should return a primaryCurrency of ${expected.primaryCurrency}`, () => {
        const { result } = renderHookWithProvider(
          () => useTransactionDisplayData(transactionGroup),
          getMockState(),
          pathname,
        );
        expect(result.current.primaryCurrency).toStrictEqual(
          expected.primaryCurrency,
        );
      });

      it(`should return a secondaryCurrency of ${expected.secondaryCurrency} for ${transactionGroup.primaryTransaction.type}`, () => {
        const { result } = renderHookWithProvider(
          () => useTransactionDisplayData(transactionGroup),
          getMockState(),
          pathname,
        );
        expect(result.current.secondaryCurrency).toStrictEqual(
          expected.secondaryCurrency,
        );
      });

      it(`should return a recipientAddress of ${expected.recipientAddress}`, () => {
        const { result } = renderHookWithProvider(
          () => useTransactionDisplayData(transactionGroup),
          getMockState(),
          pathname,
        );
        expect(result.current.recipientAddress).toStrictEqual(
          expected.recipientAddress,
        );
      });
    });
  });

  it('should return an appropriate object', () => {
    const { result } = renderHookWithProvider(
      () => useTransactionDisplayData(transactions[0]),
      getMockState(),
      DEFAULT_ROUTE,
    );
    expect(result.current).toStrictEqual(expectedResults[0]);
  });

  it('should return "Perps withdraw" title for a perpsWithdraw transaction', () => {
    const perpsWithdrawGroup = {
      nonce: '0x1',
      initialTransaction: {
        id: 'perps-withdraw-test',
        time: 1700000000000,
        status: 'confirmed',
        chainId: CHAIN_IDS.MAINNET,
        txParams: {
          from: '0x9eca64466f257793eaa52fcfff5066894b76a149',
          to: '0xabca64466f257793eaa52fcfff5066894b76a149',
          value: '0x0',
          data: '0xa9059cbb',
        },
        type: 'perpsWithdraw',
        metamaskPay: {
          chainId: CHAIN_IDS.MAINNET,
          tokenAddress: '0xabca64466f257793eaa52fcfff5066894b76a149',
        },
      },
      primaryTransaction: {
        id: 'perps-withdraw-test',
        time: 1700000000000,
        status: 'confirmed',
        chainId: CHAIN_IDS.MAINNET,
        txParams: {
          from: '0x9eca64466f257793eaa52fcfff5066894b76a149',
          to: '0xabca64466f257793eaa52fcfff5066894b76a149',
          value: '0x0',
          data: '0xa9059cbb',
        },
        type: 'perpsWithdraw',
      },
      transactions: [],
      hasRetried: false,
      hasCancelled: false,
    };

    const { result } = renderHookWithProvider(
      () => useTransactionDisplayData(perpsWithdrawGroup),
      getMockState(),
      DEFAULT_ROUTE,
    );
    expect(result.current.title).toBe('Perps withdraw');
  });

  describe('post-quote pay flows (e.g. Perps Withdraw)', () => {
    const NATIVE_ADDRESS = '0x0000000000000000000000000000000000000000';
    const ERC20_ADDRESS = '0xdac17f958d2ee523a2206206994597c13d831ec7';

    function buildPostQuoteGroup({ tokenAddress, targetFiat }) {
      const tx = {
        id: 'perps-withdraw-post-quote',
        time: 1700000000000,
        status: 'confirmed',
        chainId: CHAIN_IDS.MAINNET,
        txParams: {
          from: '0x9eca64466f257793eaa52fcfff5066894b76a149',
          to: '0xabca64466f257793eaa52fcfff5066894b76a149',
          value: '0x0',
          data: '0xa9059cbb',
        },
        type: 'perpsWithdraw',
        metamaskPay: {
          isPostQuote: true,
          chainId: CHAIN_IDS.MAINNET,
          tokenAddress,
          targetFiat,
        },
      };
      return {
        nonce: '0x1',
        initialTransaction: tx,
        primaryTransaction: tx,
        transactions: [],
        hasRetried: false,
        hasCancelled: false,
      };
    }

    function buildPostQuoteState({ withErc20Token, withMarketData } = {}) {
      const base = getMockState();
      return {
        ...base,
        metamask: {
          ...base.metamask,
          currencyRates: {
            ETH: { conversionRate: 3000, usdConversionRate: 3000 },
          },
          marketData: withMarketData
            ? {
                [CHAIN_IDS.MAINNET]: {
                  // marketData is keyed by checksummed address
                  '0xdAC17F958D2ee523a2206206994597C13D831ec7': {
                    price: 0.000333,
                  },
                },
              }
            : {},
          tokensChainsCache: withErc20Token
            ? {
                ...base.metamask.tokensChainsCache,
                [CHAIN_IDS.MAINNET]: {
                  data: {
                    [ERC20_ADDRESS]: {
                      address: ERC20_ADDRESS,
                      symbol: 'USDT',
                      decimals: 6,
                    },
                  },
                },
              }
            : base.metamask.tokensChainsCache,
        },
      };
    }

    it('renders destination native symbol and derived amount when target is native', () => {
      const { result } = renderHookWithProvider(
        () =>
          useTransactionDisplayData(
            buildPostQuoteGroup({
              tokenAddress: NATIVE_ADDRESS,
              targetFiat: '0.27',
            }),
          ),
        buildPostQuoteState(),
        DEFAULT_ROUTE,
      );

      // 0.27 / 3000 = 0.00009 -> toPrecision(4) = "0.00009000"
      expect(result.current.primaryCurrency).toBe('0.00009000 ETH');
    });

    it('renders destination ERC-20 symbol and derived amount when target is an ERC-20 with market data', () => {
      const { result } = renderHookWithProvider(
        () =>
          useTransactionDisplayData(
            buildPostQuoteGroup({
              tokenAddress: ERC20_ADDRESS,
              targetFiat: '100',
            }),
          ),
        buildPostQuoteState({ withErc20Token: true, withMarketData: true }),
        DEFAULT_ROUTE,
      );

      // tokenUsdRate = 0.000333 * 3000 = 0.999
      // 100 / 0.999 ≈ 100.10 -> toFixed(2) = "100.10"
      expect(result.current.primaryCurrency).toBe('100.10 USDT');
    });

    it('renders the USD value (and no destination-token symbol) when the destination token rate is unavailable', () => {
      const { result } = renderHookWithProvider(
        () =>
          useTransactionDisplayData(
            buildPostQuoteGroup({
              tokenAddress: ERC20_ADDRESS,
              targetFiat: '50',
            }),
          ),
        buildPostQuoteState({ withErc20Token: true }),
        DEFAULT_ROUTE,
      );

      // No marketData -> tokenUsdRate = 0 -> receivedAmount undefined.
      // The fallback uses the USD-pinned formatter for both primary and
      // secondary, bypassing `useCurrencyDisplay`'s default behavior of
      // appending the chain native ticker (which would misleadingly
      // render "$50" as "50 ETH" / "50 BNB").
      expect(result.current.primaryCurrency).toBe('$50.00');
      expect(result.current.primaryCurrency).not.toContain('USDT');
      expect(result.current.primaryCurrency).not.toContain('ETH');
    });
  });

  it('should return "Claim Bonus" title for a contractInteraction sent to the Merkl distributor address', () => {
    const merklClaimGroup = {
      nonce: '0x1',
      initialTransaction: {
        id: 'merkl-claim-test',
        time: 1700000000000,
        status: 'confirmed',
        chainId: '0xe708',
        txParams: {
          from: '0x9eca64466f257793eaa52fcfff5066894b76a149',
          to: MERKL_DISTRIBUTOR_ADDRESS,
          value: '0x0',
          data: '0x71ee95c0',
        },
        type: 'contractInteraction',
      },
      primaryTransaction: {
        id: 'merkl-claim-test',
        time: 1700000000000,
        status: 'confirmed',
        chainId: '0xe708',
        txParams: {
          from: '0x9eca64466f257793eaa52fcfff5066894b76a149',
          to: MERKL_DISTRIBUTOR_ADDRESS,
          value: '0x0',
          data: '0x71ee95c0',
        },
        type: 'contractInteraction',
      },
      transactions: [],
      hasRetried: false,
      hasCancelled: false,
    };

    const { result } = renderHookWithProvider(
      () => useTransactionDisplayData(merklClaimGroup),
      getMockState(),
      DEFAULT_ROUTE,
    );
    expect(result.current.title).toBe('Claim bonus');
  });
});
