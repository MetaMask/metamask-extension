import { TransactionMeta } from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';
import { genUnapprovedTokenTransferConfirmation } from '../../../../../../../test/data/confirmations/token-transfer';
import mockState from '../../../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../../../test/lib/render-helpers';
import { selectERC20TokensByChain } from '../../../../../../selectors';
import { useTokenDetails } from './useTokenDetails';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

const ICON_SYMBOL = 'FROG';
const ICON_URL =
  'https://static.cx.metamask.io/api/v1/tokenIcons/1/0x0a2c375553e6965b42c135bb8b15a8914b08de0c.png';
const MOCK_TOKEN_LIST_BY_CHAIN = (transactionMeta: TransactionMeta) => ({
  [transactionMeta.chainId]: {
    data: {
      [(transactionMeta.txParams.to as string).toLowerCase()]: {
        address: transactionMeta.txParams.to,
        aggregators: ['CoinGecko', 'Socket', 'Coinmarketcap'],
        decimals: 9,
        iconUrl: ICON_URL,
        name: 'Frog on ETH',
        occurrences: 3,
        symbol: ICON_SYMBOL,
      },
    },
  },
});

describe('useTokenDetails', () => {
  const useSelectorMock = useSelector as jest.Mock;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns token details from the token list if it exists', () => {
    const transactionMeta = genUnapprovedTokenTransferConfirmation(
      {},
    ) as TransactionMeta;

    useSelectorMock.mockImplementation((selector) => {
      if (selector === selectERC20TokensByChain) {
        return MOCK_TOKEN_LIST_BY_CHAIN(transactionMeta);
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

  it('returns undefined for tokenImage and "Unknown" for tokenSymbol if token is not found', () => {
    const transactionMeta = genUnapprovedTokenTransferConfirmation(
      {},
    ) as TransactionMeta;

    useSelectorMock.mockImplementation((selector) => {
      if (selector === selectERC20TokensByChain) {
        return {};
      }
      return undefined;
    });

    const { result } = renderHookWithProvider(
      () => useTokenDetails(transactionMeta),
      mockState,
    );

    expect(result.current).toEqual({
      tokenImage: undefined,
      tokenSymbol: 'Unknown',
    });
  });

  it('returns undefined for tokenImage and "Unknown" for tokenSymbol if chainId is not in token list', () => {
    const transactionMeta = genUnapprovedTokenTransferConfirmation(
      {},
    ) as TransactionMeta;

    useSelectorMock.mockImplementation((selector) => {
      if (selector === selectERC20TokensByChain) {
        return {
          '0x999': {
            data: {
              '0xsomeotheraddress': {
                iconUrl: ICON_URL,
                symbol: ICON_SYMBOL,
              },
            },
          },
        };
      }
      return undefined;
    });

    const { result } = renderHookWithProvider(
      () => useTokenDetails(transactionMeta),
      mockState,
    );

    expect(result.current).toEqual({
      tokenImage: undefined,
      tokenSymbol: 'Unknown',
    });
  });

  it('returns undefined for tokenImage and "Unknown" for tokenSymbol if token address is not in chain data', () => {
    const transactionMeta = genUnapprovedTokenTransferConfirmation(
      {},
    ) as TransactionMeta;

    useSelectorMock.mockImplementation((selector) => {
      if (selector === selectERC20TokensByChain) {
        return {
          [transactionMeta.chainId]: {
            data: {
              '0xdifferentaddress': {
                iconUrl: ICON_URL,
                symbol: ICON_SYMBOL,
              },
            },
          },
        };
      }
      return undefined;
    });

    const { result } = renderHookWithProvider(
      () => useTokenDetails(transactionMeta),
      mockState,
    );

    expect(result.current).toEqual({
      tokenImage: undefined,
      tokenSymbol: 'Unknown',
    });
  });
});
