import { TransactionMeta } from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';
import { genUnapprovedTokenTransferConfirmation } from '../../../../../../../test/data/confirmations/token-transfer';
import mockState from '../../../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../../../test/lib/render-helpers-navigate';
import { getTokenList } from '../../../../../../selectors';
import { useTokenDetails } from './useTokenDetails';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

const ICON_SYMBOL = 'FROG';
const ICON_URL =
  'https://static.cx.metamask.io/api/v1/tokenIcons/1/0x0a2c375553e6965b42c135bb8b15a8914b08de0c.png';
const MOCK_TOKEN_LIST = (transactionMeta: TransactionMeta) => ({
  [transactionMeta.txParams.to as string]: {
    address: transactionMeta.txParams.to,
    aggregators: ['CoinGecko', 'Socket', 'Coinmarketcap'],
    decimals: 9,
    iconUrl: ICON_URL,
    name: 'Frog on ETH',
    occurrences: 3,
    symbol: ICON_SYMBOL,
  },
});

describe('useTokenDetails', () => {
  const useSelectorMock = useSelector as jest.Mock;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns token details from selected token if it exists', () => {
    const transactionMeta = genUnapprovedTokenTransferConfirmation(
      {},
    ) as TransactionMeta;

    const TEST_SELECTED_TOKEN = {
      address: 'address',
      decimals: 18,
      symbol: 'symbol',
      iconUrl: 'iconUrl',
      image: 'image',
    };

    useSelectorMock.mockImplementation((selector) => {
      if (selector === getTokenList) {
        return MOCK_TOKEN_LIST(transactionMeta);
      } else if (selector?.toString().includes('getWatchedToken')) {
        return TEST_SELECTED_TOKEN;
      }
      return undefined;
    });

    const { result } = renderHookWithProvider(
      () => useTokenDetails(transactionMeta),
      mockState,
    );

    expect(result.current).toEqual({
      tokenImage: 'iconUrl',
      tokenSymbol: 'symbol',
    });
  });

  it('returns token details from the token list if it exists', () => {
    const transactionMeta = genUnapprovedTokenTransferConfirmation(
      {},
    ) as TransactionMeta;

    const TEST_SELECTED_TOKEN = {
      address: 'address',
      decimals: 18,
    };

    useSelectorMock.mockImplementation((selector) => {
      if (selector === getTokenList) {
        return MOCK_TOKEN_LIST(transactionMeta);
      } else if (selector?.toString().includes('getWatchedToken')) {
        return TEST_SELECTED_TOKEN;
      }

      return undefined;
    });

    const { result } = renderHookWithProvider(
      () => useTokenDetails(transactionMeta),
      mockState,
    );

    expect(result.current).toEqual({
      tokenImage: ICON_URL,
      tokenSymbol: ICON_SYMBOL,
    });
  });

  it('returns selected token image if no iconUrl is included', () => {
    const transactionMeta = genUnapprovedTokenTransferConfirmation(
      {},
    ) as TransactionMeta;

    const TEST_SELECTED_TOKEN = {
      address: 'address',
      decimals: 18,
      symbol: 'symbol',
      image: 'image',
    };

    useSelectorMock.mockImplementation((selector) => {
      if (selector === getTokenList) {
        return MOCK_TOKEN_LIST(transactionMeta);
      } else if (selector?.toString().includes('getWatchedToken')) {
        return TEST_SELECTED_TOKEN;
      }
      return undefined;
    });

    const { result } = renderHookWithProvider(
      () => useTokenDetails(transactionMeta),
      mockState,
    );

    expect(result.current).toEqual({
      tokenImage: 'image',
      tokenSymbol: 'symbol',
    });
  });

  it('returns token list icon url if no image is included in the token', () => {
    const transactionMeta = genUnapprovedTokenTransferConfirmation(
      {},
    ) as TransactionMeta;

    const TEST_SELECTED_TOKEN = {
      address: 'address',
      decimals: 18,
      symbol: 'symbol',
    };

    useSelectorMock.mockImplementation((selector) => {
      if (selector === getTokenList) {
        return MOCK_TOKEN_LIST(transactionMeta);
      } else if (selector?.toString().includes('getWatchedToken')) {
        return TEST_SELECTED_TOKEN;
      }
      return undefined;
    });

    const { result } = renderHookWithProvider(
      () => useTokenDetails(transactionMeta),
      mockState,
    );

    expect(result.current).toEqual({
      tokenImage: ICON_URL,
      tokenSymbol: 'symbol',
    });
  });

  it('returns undefined if no image is found', () => {
    const transactionMeta = genUnapprovedTokenTransferConfirmation(
      {},
    ) as TransactionMeta;

    const TEST_SELECTED_TOKEN = {
      address: 'address',
      decimals: 18,
      symbol: 'symbol',
    };

    useSelectorMock.mockImplementation((selector) => {
      if (selector === getTokenList) {
        return {};
      } else if (selector?.toString().includes('getWatchedToken')) {
        return TEST_SELECTED_TOKEN;
      }
      return undefined;
    });

    const { result } = renderHookWithProvider(
      () => useTokenDetails(transactionMeta),
      mockState,
    );

    expect(result.current).toEqual({
      tokenImage: undefined,
      tokenSymbol: 'symbol',
    });
  });
});
