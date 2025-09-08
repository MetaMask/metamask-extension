import { renderHook } from '@testing-library/react-hooks';
import { useSelector } from 'react-redux';
import { getIntlLocale } from '../../ducks/locale/locale';
import { getCurrentCurrency } from '../../ducks/metamask/metamask';
import { selectBalanceForAllWallets } from '../../selectors/assets';
import { getAccountTree } from '../../selectors/multichain-accounts/account-tree';
import {
  useAccountBalanceCallback,
  useAllWalletAccountsBalances,
  useDisplayBalanceCalc,
} from './useAccountBalance';

jest.mock('react-redux');
jest.mock('../../selectors/assets');
jest.mock('../../ducks/metamask/metamask');
jest.mock('../../ducks/locale/locale');
jest.mock('../../selectors/multichain-accounts/account-tree');

const mockUseSelector = jest.mocked(useSelector);
const mockSelectBalanceForAllWallets = jest.mocked(selectBalanceForAllWallets);
const mockGetCurrentCurrency = jest.mocked(getCurrentCurrency);
const mockGetIntlLocale = jest.mocked(getIntlLocale);
const mockGetAccountTree = jest.mocked(getAccountTree);

// type utility for testing purposes only
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockVar = any;

describe('useDisplayBalanceCalc', () => {
  const arrange = () => {
    mockGetCurrentCurrency.mockReturnValue('USD');
    mockGetIntlLocale.mockReturnValue('en-US');

    mockUseSelector.mockImplementation((selector) => {
      const mockStore = {} as MockVar;
      if (selector === getCurrentCurrency) {
        return mockGetCurrentCurrency(mockStore);
      }
      if (selector === getIntlLocale) {
        return mockGetIntlLocale(mockStore);
      }
      throw new Error(`unmocked selector called: ${selector.name}`);
    });

    return {
      mockGetCurrentCurrency,
      mockGetIntlLocale,
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('formats balance with provided parameters', () => {
    arrange();

    const { result } = renderHook(() => useDisplayBalanceCalc());
    const displayBalanceCalc = result.current;

    const formatted = displayBalanceCalc(150.75, 'USD');

    expect(formatted).toBe('$150.75');
  });

  it('formats small balance with threshold', () => {
    arrange();

    const { result } = renderHook(() => useDisplayBalanceCalc());
    const displayBalanceCalc = result.current;

    const formatted = displayBalanceCalc(0.005, 'USD');

    expect(formatted).toBe('<$0.01');
  });
});

describe('useAccountBalanceCallback', () => {
  const createMockAllBalances = () => ({
    wallets: {
      wallet1: {
        groups: {
          group1: {
            totalBalanceInUserCurrency: 100.5,
            userCurrency: 'USD',
          },
          group2: {
            totalBalanceInUserCurrency: 0.005,
            userCurrency: 'USD',
          },
        },
      },
    },
  });

  const arrange = (allBalances = createMockAllBalances()) => {
    mockSelectBalanceForAllWallets.mockReturnValue(allBalances as MockVar);
    mockGetCurrentCurrency.mockReturnValue('USD');
    mockGetIntlLocale.mockReturnValue('en-US');

    mockUseSelector.mockImplementation((selector) => {
      const mockStore = {} as MockVar;
      if (selector === selectBalanceForAllWallets) {
        return mockSelectBalanceForAllWallets(mockStore);
      }
      if (selector === getCurrentCurrency) {
        return mockGetCurrentCurrency(mockStore);
      }
      if (selector === getIntlLocale) {
        return mockGetIntlLocale(mockStore);
      }
      throw new Error(`unmocked selector called: ${selector.name}`);
    });

    return {
      mockSelectBalanceForAllWallets,
      mockGetCurrentCurrency,
      mockGetIntlLocale,
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns formatted balance for valid wallet and group', () => {
    arrange();

    const { result } = renderHook(() => useAccountBalanceCallback());
    const getDisplayBalance = result.current;

    const balance = getDisplayBalance('wallet1', 'group1');

    expect(balance).toBe('$100.50');
  });

  it('returns formatted balance below threshold', () => {
    arrange();

    const { result } = renderHook(() => useAccountBalanceCallback());
    const getDisplayBalance = result.current;

    const balance = getDisplayBalance('wallet1', 'group2');

    expect(balance).toBe('<$0.01');
  });

  it('handles missing wallet gracefully', () => {
    arrange();

    const { result } = renderHook(() => useAccountBalanceCallback());
    const getDisplayBalance = result.current;

    const balance = getDisplayBalance('nonexistent', 'group1');

    expect(balance).toBeUndefined();
  });

  it('handles missing group gracefully', () => {
    arrange();

    const { result } = renderHook(() => useAccountBalanceCallback());
    const getDisplayBalance = result.current;

    const balance = getDisplayBalance('wallet1', 'nonexistent');

    expect(balance).toBeUndefined();
  });
});

describe('useAllWalletAccountsBalances', () => {
  const createMockAccountTree = () => ({
    wallets: {
      wallet1: {
        groups: {
          group1: {},
          group2: {},
        },
      },
      wallet2: {
        groups: {
          group1: {},
        },
      },
    },
  });

  const createMockAllBalances = () => ({
    wallets: {
      wallet1: {
        groups: {
          group1: {
            totalBalanceInUserCurrency: 100.5,
            userCurrency: 'USD',
          },
          group2: {
            totalBalanceInUserCurrency: 200.75,
            userCurrency: 'EUR',
          },
        },
      },
      wallet2: {
        groups: {
          group1: {
            totalBalanceInUserCurrency: 50.25,
            userCurrency: 'GBP',
          },
        },
      },
    },
  });

  const arrange = (
    accountTree = createMockAccountTree(),
    allBalances = createMockAllBalances(),
  ) => {
    mockGetAccountTree.mockReturnValue(accountTree as MockVar);
    mockSelectBalanceForAllWallets.mockReturnValue(allBalances as MockVar);
    mockGetCurrentCurrency.mockReturnValue('USD');
    mockGetIntlLocale.mockReturnValue('en-US');

    mockUseSelector.mockImplementation((selector) => {
      const mockStore = {} as MockVar;
      if (selector === getAccountTree) {
        return mockGetAccountTree(mockStore);
      }
      if (selector === selectBalanceForAllWallets) {
        return mockSelectBalanceForAllWallets(mockStore);
      }
      if (selector === getCurrentCurrency) {
        return mockGetCurrentCurrency(mockStore);
      }
      if (selector === getIntlLocale) {
        return mockGetIntlLocale(mockStore);
      }
      throw new Error(`unmocked selector called: ${selector.name}`);
    });

    return {
      mockGetAccountTree,
      mockSelectBalanceForAllWallets,
      mockGetCurrentCurrency,
      mockGetIntlLocale,
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns balances for all wallets and groups', () => {
    arrange();

    const { result } = renderHook(() => useAllWalletAccountsBalances());

    expect(result.current).toEqual({
      wallet1: {
        group1: '$100.50',
        group2: '€200.75',
      },
      wallet2: {
        group1: '£50.25',
      },
    });
  });

  it('handles empty wallets gracefully', () => {
    const mocks = arrange({ wallets: {} as MockVar });
    mocks.mockGetAccountTree.mockReturnValue({ wallets: {} } as MockVar);

    const { result } = renderHook(() => useAllWalletAccountsBalances());

    expect(result.current).toEqual({});
  });

  it('handles wallet with empty groups gracefully', () => {
    const mocks = arrange({
      wallets: {
        wallet1: { groups: {} },
      },
    } as MockVar);
    mocks.mockGetAccountTree.mockReturnValue({
      wallets: {
        wallet1: { groups: null },
      },
    } as MockVar);

    const { result } = renderHook(() => useAllWalletAccountsBalances());

    expect(result.current).toEqual({});
  });
});
