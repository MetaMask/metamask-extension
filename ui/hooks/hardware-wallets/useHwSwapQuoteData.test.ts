import { renderHook } from '@testing-library/react-hooks';
import { useHwSwapQuoteData } from './useHwSwapQuoteData';

jest.mock('../../ducks/bridge/selectors', () => ({
  getBridgeQuotes: jest.fn(),
  getFromToken: jest.fn(),
  getToToken: jest.fn(),
}));

jest.mock('../../../shared/lib/selectors/keyring', () => ({
  getHardwareWalletType: jest.fn(),
  isHardwareWallet: jest.fn(),
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

const mockUseSelector = jest.requireMock('react-redux').useSelector;
const mockGetBridgeQuotes = jest.requireMock(
  '../../ducks/bridge/selectors',
).getBridgeQuotes;
const mockGetFromToken = jest.requireMock(
  '../../ducks/bridge/selectors',
).getFromToken;
const mockGetToToken = jest.requireMock(
  '../../ducks/bridge/selectors',
).getToToken;
const mockGetHardwareWalletType = jest.requireMock(
  '../../../shared/lib/selectors/keyring',
).getHardwareWalletType;

const mockFromToken = {
  address: '0x0000000000000000000000000000000000000000',
  symbol: 'ETH',
  decimals: 18,
};

const mockToToken = {
  address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  symbol: 'USDC',
  decimals: 6,
};

const mockActiveQuote = {
  quote: { requestId: 'test-request-1' },
  quoteMetadata: {},
};

function setupSelectorMocks() {
  mockUseSelector.mockImplementation((selector: unknown) => {
    if (selector === mockGetBridgeQuotes) {
      return mockGetBridgeQuotes();
    }
    if (selector === mockGetFromToken) {
      return mockGetFromToken();
    }
    if (selector === mockGetToToken) {
      return mockGetToToken();
    }
    if (selector === mockGetHardwareWalletType) {
      return mockGetHardwareWalletType();
    }
    return undefined;
  });
}

describe('useHwSwapQuoteData', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockGetBridgeQuotes.mockReturnValue({
      activeQuote: undefined,
      quotes: [],
    });
    mockGetFromToken.mockReturnValue(mockFromToken);
    mockGetToToken.mockReturnValue(mockToToken);
    mockGetHardwareWalletType.mockReturnValue('Ledger Hardware');
  });

  it('returns activeQuote, fromToken, toToken, and hardwareWalletType', () => {
    mockGetBridgeQuotes.mockReturnValue({
      activeQuote: mockActiveQuote,
      quotes: [],
    });
    setupSelectorMocks();

    const { result } = renderHook(() => useHwSwapQuoteData());

    expect(result.current.activeQuote).toEqual(mockActiveQuote);
    expect(result.current.fromToken).toEqual(mockFromToken);
    expect(result.current.toToken).toEqual(mockToToken);
    expect(result.current.hardwareWalletType).toBe('Ledger Hardware');
  });

  it('returns undefined activeQuote when no active quote exists', () => {
    mockGetBridgeQuotes.mockReturnValue({
      activeQuote: undefined,
      quotes: [],
    });
    setupSelectorMocks();

    const { result } = renderHook(() => useHwSwapQuoteData());

    expect(result.current.activeQuote).toBeUndefined();
  });

  it('locks the first activeQuote and keeps it even when activeQuote becomes undefined', () => {
    mockGetBridgeQuotes.mockReturnValue({
      activeQuote: mockActiveQuote,
      quotes: [],
    });
    setupSelectorMocks();

    const { result, rerender } = renderHook(() => useHwSwapQuoteData());

    expect(result.current.activeQuote).toEqual(mockActiveQuote);
    expect(result.current.lockedQuote).toEqual(mockActiveQuote);

    mockGetBridgeQuotes.mockReturnValue({
      activeQuote: undefined,
      quotes: [],
    });

    rerender();

    expect(result.current.activeQuote).toBeUndefined();
    expect(result.current.lockedQuote).toEqual(mockActiveQuote);
  });

  it('does not overwrite lockedQuote when it is already set and activeQuote changes', () => {
    const firstQuote = { quote: { requestId: 'first' }, quoteMetadata: {} };
    const secondQuote = { quote: { requestId: 'second' }, quoteMetadata: {} };

    mockGetBridgeQuotes.mockReturnValue({
      activeQuote: firstQuote,
      quotes: [],
    });
    setupSelectorMocks();

    const { result, rerender } = renderHook(() => useHwSwapQuoteData());

    expect(result.current.lockedQuote).toEqual(firstQuote);

    mockGetBridgeQuotes.mockReturnValue({
      activeQuote: secondQuote,
      quotes: [],
    });
    rerender();

    expect(result.current.activeQuote).toEqual(secondQuote);
    expect(result.current.lockedQuote).toEqual(firstQuote);
  });

  it('returns undefined hardwareWalletType when not a hardware wallet', () => {
    mockGetHardwareWalletType.mockReturnValue(undefined);
    setupSelectorMocks();

    const { result } = renderHook(() => useHwSwapQuoteData());

    expect(result.current.hardwareWalletType).toBeUndefined();
  });
});
