import { renderHook } from '@testing-library/react-hooks';
import { useMusdBalance } from './useMusdBalance';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../../selectors/assets', () => ({
  getAssetsBySelectedAccountGroup: jest.fn(),
}));

jest.mock('../../selectors', () => ({
  getSelectedAccount: jest.fn(),
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
  accountGroupAssets: Record<string, unknown[]>;
};

function setupSelectors(overrides: Partial<SelectorSetup> = {}) {
  const defaults: SelectorSetup = {
    selectedAccount: { address: MOCK_ADDRESS },
    accountGroupAssets: {},
    ...overrides,
  };

  let callIndex = 0;
  useSelector.mockImplementation(() => {
    const idx = callIndex;
    callIndex += 1;
    switch (idx % 2) {
      case 0:
        return defaults.selectedAccount;
      case 1:
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

  describe('mUSD balance detection', () => {
    it('detects mUSD balance from accountGroupAssets', () => {
      setupSelectors({
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

    it('returns no balance when mUSD token has zero balance', () => {
      setupSelectors({
        accountGroupAssets: {
          '0x1': [{ address: '0xMusdAddr', balance: '0' }],
        },
      });

      const { result } = renderHook(() => useMusdBalance());

      expect(result.current.hasMusdBalance).toBe(false);
      expect(result.current.totalMusdBalance).toBe('0');
    });

    it('ignores non-mUSD tokens', () => {
      setupSelectors({
        accountGroupAssets: {
          '0x1': [{ address: '0xOtherToken', balance: '5000' }],
        },
      });

      const { result } = renderHook(() => useMusdBalance());

      expect(result.current.hasMusdBalance).toBe(false);
    });

    it('sums balances across multiple chains', () => {
      setupSelectors({
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
        accountGroupAssets: {
          '0x999': [{ address: '0xMusdAddr', balance: '500' }],
        },
      });

      const { result } = renderHook(() => useMusdBalance());

      expect(result.current.hasMusdBalance).toBe(false);
    });

    it('skips assets without address', () => {
      setupSelectors({
        accountGroupAssets: {
          '0x1': [{ symbol: 'ETH', balance: '1000000' }],
        },
      });

      const { result } = renderHook(() => useMusdBalance());

      expect(result.current.hasMusdBalance).toBe(false);
    });

    it('handles empty accountGroupAssets', () => {
      setupSelectors({ accountGroupAssets: {} });

      const { result } = renderHook(() => useMusdBalance());

      expect(result.current.hasMusdBalance).toBe(false);
      expect(result.current.totalMusdBalance).toBe('0');
    });
  });

  it('always returns isLoading as false', () => {
    setupSelectors();

    const { result } = renderHook(() => useMusdBalance());

    expect(result.current.isLoading).toBe(false);
  });
});
