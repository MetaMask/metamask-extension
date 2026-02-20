import { renderHook } from '@testing-library/react-hooks';
import { useMusdBalance } from './useMusdBalance';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../../selectors/assets', () => ({
  getTokenBalancesEvm: jest.fn(),
  getAssetsBySelectedAccountGroup: jest.fn(),
}));

jest.mock('../../selectors', () => ({
  getSelectedAccount: jest.fn(),
}));

jest.mock('../../selectors/multichain-accounts/feature-flags', () => ({
  getIsMultichainAccountsState2Enabled: jest.fn(),
}));

jest.mock('../../components/app/musd/constants', () => ({
  MUSD_TOKEN_ADDRESS: '0xMusdAddr',
  isMusdToken: jest.fn((addr: string) => addr.toLowerCase() === '0xmusdaddr'),
  isMusdSupportedChain: jest.fn((chainId: string) =>
    ['0x1', '0xe708'].includes(chainId),
  ),
}));

const { useSelector } = jest.requireMock('react-redux');

const MOCK_ADDRESS = '0xabcdef1234567890abcdef1234567890abcdef12';

type SelectorSetup = {
  selectedAccount: { address: string } | null;
  isMultichain: boolean;
  evmBalances: unknown;
  accountGroupAssets: Record<string, unknown[]>;
};

function setupSelectors(overrides: Partial<SelectorSetup> = {}) {
  const defaults: SelectorSetup = {
    selectedAccount: { address: MOCK_ADDRESS },
    isMultichain: false,
    evmBalances: [],
    accountGroupAssets: {},
    ...overrides,
  };

  let callIndex = 0;
  useSelector.mockImplementation(() => {
    const idx = callIndex;
    callIndex += 1;
    switch (idx % 4) {
      case 0:
        return defaults.selectedAccount;
      case 1:
        return defaults.isMultichain;
      case 2:
        return defaults.evmBalances;
      case 3:
        return defaults.accountGroupAssets;
      default:
        return undefined;
    }
  });
}

describe('useMusdBalance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when no account is selected', () => {
    it('returns empty balance state', () => {
      setupSelectors({ selectedAccount: null });

      const { result } = renderHook(() => useMusdBalance());

      expect(result.current).toEqual({
        hasMusdBalance: false,
        totalMusdBalance: '0',
        musdBalancesByChain: {},
        isLoading: false,
      });
    });
  });

  describe('legacy EVM balances (multichain disabled)', () => {
    it('detects mUSD balance from legacy token list', () => {
      setupSelectors({
        isMultichain: false,
        evmBalances: [
          {
            address: '0xMusdAddr',
            chainId: '0x1',
            balance: '1000000',
            symbol: 'MUSD',
          },
        ],
      });

      const { result } = renderHook(() => useMusdBalance());

      expect(result.current.hasMusdBalance).toBe(true);
      expect(result.current.totalMusdBalance).toBe('1000000');
      expect(result.current.musdBalancesByChain).toEqual({
        '0x1': '1000000',
      });
    });

    it('returns no balance when mUSD token has zero balance', () => {
      setupSelectors({
        isMultichain: false,
        evmBalances: [
          {
            address: '0xMusdAddr',
            chainId: '0x1',
            balance: '0',
            symbol: 'MUSD',
          },
        ],
      });

      const { result } = renderHook(() => useMusdBalance());

      expect(result.current.hasMusdBalance).toBe(false);
      expect(result.current.totalMusdBalance).toBe('0');
    });

    it('ignores non-mUSD tokens', () => {
      setupSelectors({
        isMultichain: false,
        evmBalances: [
          {
            address: '0xOtherToken',
            chainId: '0x1',
            balance: '5000',
            symbol: 'USDC',
          },
        ],
      });

      const { result } = renderHook(() => useMusdBalance());

      expect(result.current.hasMusdBalance).toBe(false);
    });

    it('ignores mUSD on unsupported chains', () => {
      setupSelectors({
        isMultichain: false,
        evmBalances: [
          {
            address: '0xMusdAddr',
            chainId: '0x999',
            balance: '1000',
            symbol: 'MUSD',
          },
        ],
      });

      const { result } = renderHook(() => useMusdBalance());

      expect(result.current.hasMusdBalance).toBe(false);
    });

    it('handles null evmBalances', () => {
      setupSelectors({ isMultichain: false, evmBalances: null });

      const { result } = renderHook(() => useMusdBalance());

      expect(result.current.hasMusdBalance).toBe(false);
      expect(result.current.totalMusdBalance).toBe('0');
    });
  });

  describe('multichain balances (multichain enabled)', () => {
    it('detects mUSD balance from accountGroupAssets', () => {
      setupSelectors({
        isMultichain: true,
        accountGroupAssets: {
          '0x1': [{ address: '0xMusdAddr', balance: '2000000' }],
        },
      });

      const { result } = renderHook(() => useMusdBalance());

      expect(result.current.hasMusdBalance).toBe(true);
      expect(result.current.totalMusdBalance).toBe('2000000');
      expect(result.current.musdBalancesByChain).toEqual({
        '0x1': '2000000',
      });
    });

    it('sums balances across multiple chains', () => {
      setupSelectors({
        isMultichain: true,
        accountGroupAssets: {
          '0x1': [{ address: '0xMusdAddr', balance: '1000000' }],
          '0xe708': [{ address: '0xMusdAddr', balance: '3000000' }],
        },
      });

      const { result } = renderHook(() => useMusdBalance());

      expect(result.current.hasMusdBalance).toBe(true);
      expect(result.current.totalMusdBalance).toBe('4000000');
      expect(result.current.musdBalancesByChain).toEqual({
        '0x1': '1000000',
        '0xe708': '3000000',
      });
    });

    it('skips unsupported chains', () => {
      setupSelectors({
        isMultichain: true,
        accountGroupAssets: {
          '0x999': [{ address: '0xMusdAddr', balance: '500' }],
        },
      });

      const { result } = renderHook(() => useMusdBalance());

      expect(result.current.hasMusdBalance).toBe(false);
    });

    it('skips assets without address', () => {
      setupSelectors({
        isMultichain: true,
        accountGroupAssets: {
          '0x1': [{ symbol: 'ETH', balance: '1000000' }],
        },
      });

      const { result } = renderHook(() => useMusdBalance());

      expect(result.current.hasMusdBalance).toBe(false);
    });
  });

  it('always returns isLoading as false', () => {
    setupSelectors();

    const { result } = renderHook(() => useMusdBalance());

    expect(result.current.isLoading).toBe(false);
  });
});
