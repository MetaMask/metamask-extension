import { TransactionMeta } from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';
import { genUnapprovedTokenTransferConfirmation } from '../../../../../../../test/data/confirmations/token-transfer';
import mockState from '../../../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../../../test/lib/render-helpers';
import { getTokenList, getCurrentChainId } from '../../../../../../selectors';
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
  const MOCK_CHAIN_ID = '0x1';

  beforeEach(() => {
    jest.resetAllMocks();
    useSelectorMock.mockImplementation((selector) => {
      if (selector === getCurrentChainId) {
        return MOCK_CHAIN_ID;
      }
      return undefined;
    });
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

  it('filters out tokens from different chains', () => {
    const transactionMeta = genUnapprovedTokenTransferConfirmation(
      {},
    ) as TransactionMeta;

    const tokenListWithDifferentChain = {
      [transactionMeta.txParams.to as string]: {
        ...MOCK_TOKEN_LIST(transactionMeta)[transactionMeta.txParams.to as string],
        chainId: '0x2', // Different chain ID
      },
    };

    const TEST_SELECTED_TOKEN = {
      address: 'address',
      decimals: 18,
    };

    useSelectorMock.mockImplementation((selector) => {
      if (selector === getTokenList) {
        return tokenListWithDifferentChain;
      } else if (selector?.toString().includes('getWatchedToken')) {
        return TEST_SELECTED_TOKEN;
      } else if (selector === getCurrentChainId) {
        return MOCK_CHAIN_ID; // Current chain is 0x1
      }
      return undefined;
    });

    const { result } = renderHookWithProvider(
      () => useTokenDetails(transactionMeta),
      mockState,
    );

    // Should not return token from different chain
    expect(result.current).toEqual({
      tokenImage: undefined,
      tokenSymbol: 'unknown',
    });
  });

  it('includes tokens from the same chain', () => {
    const transactionMeta = genUnapprovedTokenTransferConfirmation(
      {},
    ) as TransactionMeta;

    const tokenListWithSameChain = {
      [transactionMeta.txParams.to as string]: {
        ...MOCK_TOKEN_LIST(transactionMeta)[transactionMeta.txParams.to as string],
        chainId: MOCK_CHAIN_ID, // Same chain ID
      },
    };

    const TEST_SELECTED_TOKEN = {
      address: 'address',
      decimals: 18,
    };

    useSelectorMock.mockImplementation((selector) => {
      if (selector === getTokenList) {
        return tokenListWithSameChain;
      } else if (selector?.toString().includes('getWatchedToken')) {
        return TEST_SELECTED_TOKEN;
      } else if (selector === getCurrentChainId) {
        return MOCK_CHAIN_ID;
      }
      return undefined;
    });

    const { result } = renderHookWithProvider(
      () => useTokenDetails(transactionMeta),
      mockState,
    );

    // Should include token from same chain
    expect(result.current).toEqual({
      tokenImage: ICON_URL,
      tokenSymbol: ICON_SYMBOL,
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
