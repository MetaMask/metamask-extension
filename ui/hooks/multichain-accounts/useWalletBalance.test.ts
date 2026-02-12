import { renderHook } from '@testing-library/react-hooks';
import { useSelector } from 'react-redux';
import { getIntlLocale } from '../../ducks/locale/locale';
import { getCurrentCurrency } from '../../ducks/metamask/metamask';
import { selectBalanceByWallet } from '../../selectors/assets';
import {
  useSingleWalletAccountsBalanceCallback,
  useSingleWalletDisplayBalance,
} from './useWalletBalance';

jest.mock('react-redux');
jest.mock('../../selectors/assets');
jest.mock('../../ducks/metamask/metamask');
jest.mock('../../ducks/locale/locale');

const mockUseSelector = jest.mocked(useSelector);
const mockSelectBalanceByWallet = jest.mocked(selectBalanceByWallet);
const mockGetCurrentCurrency = jest.mocked(getCurrentCurrency);
const mockGetIntlLocale = jest.mocked(getIntlLocale);

// type utility for testing purposes only
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockVar = any;

describe('useSingleWalletDisplayBalance', () => {
  const createMockWalletBalance = () => ({
    totalBalanceInUserCurrency: 500.25,
    userCurrency: 'USD',
    groups: {},
  });

  const arrange = (walletBalance = createMockWalletBalance()) => {
    mockSelectBalanceByWallet.mockReturnValue(walletBalance as MockVar);
    mockGetCurrentCurrency.mockReturnValue('USD');
    mockGetIntlLocale.mockReturnValue('en-US');

    mockUseSelector.mockImplementation((selector) => {
      const mockStore = {} as MockVar;
      if (selector === mockSelectBalanceByWallet.mock.results[0]?.value) {
        return mockSelectBalanceByWallet(mockStore);
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
      mockSelectBalanceByWallet,
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns formatted wallet total balance', () => {
    arrange();

    const { result } = renderHook(() =>
      useSingleWalletDisplayBalance('wallet1'),
    );

    expect(result.current).toBe('$500.25');
    expect(mockSelectBalanceByWallet).toHaveBeenCalledWith('wallet1');
  });

  it('creates selector with correct walletId', () => {
    arrange();

    renderHook(() => useSingleWalletDisplayBalance('wallet-test-id'));

    expect(mockSelectBalanceByWallet).toHaveBeenCalledWith('wallet-test-id');
  });

  it('handles different currency', () => {
    const walletBalance = {
      totalBalanceInUserCurrency: 150.75,
      userCurrency: 'EUR',
      groups: {},
    };
    arrange(walletBalance);

    const { result } = renderHook(() =>
      useSingleWalletDisplayBalance('wallet1'),
    );

    expect(result.current).toBe('€150.75');
  });

  it('handles small balance with threshold', () => {
    const walletBalance = {
      totalBalanceInUserCurrency: 0.005,
      userCurrency: 'USD',
      groups: {},
    };
    arrange(walletBalance);

    const { result } = renderHook(() =>
      useSingleWalletDisplayBalance('wallet1'),
    );

    expect(result.current).toBe('<$0.01');
  });
});

describe('useSingleWalletAccountsBalanceCallback', () => {
  const createMockWalletBalance = () => ({
    totalBalanceInUserCurrency: 500.25,
    userCurrency: 'USD',
    groups: {
      group1: {
        totalBalanceInUserCurrency: 100.5,
        userCurrency: 'USD',
      },
      group2: {
        totalBalanceInUserCurrency: 200.75,
        userCurrency: 'EUR',
      },
      group3: {
        totalBalanceInUserCurrency: 0.005,
        userCurrency: 'USD',
      },
    },
  });

  const arrange = (walletBalance = createMockWalletBalance()) => {
    mockSelectBalanceByWallet.mockReturnValue(walletBalance as MockVar);
    mockGetCurrentCurrency.mockReturnValue('USD');
    mockGetIntlLocale.mockReturnValue('en-US');

    mockUseSelector.mockImplementation((selector) => {
      const mockStore = {} as MockVar;
      if (selector === mockSelectBalanceByWallet.mock.results[0]?.value) {
        return mockSelectBalanceByWallet(mockStore);
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
      mockSelectBalanceByWallet,
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns callback that formats group balance', () => {
    arrange();
    const { result } = renderHook(() =>
      useSingleWalletAccountsBalanceCallback('wallet1'),
    );
    const getDisplayBalance = result.current;

    const balance = getDisplayBalance('group1');
    expect(balance).toBe('$100.50');
    expect(mockSelectBalanceByWallet).toHaveBeenCalledWith('wallet1');
  });

  it('handles different currency for group', () => {
    arrange();
    const { result } = renderHook(() =>
      useSingleWalletAccountsBalanceCallback('wallet1'),
    );
    const getDisplayBalance = result.current;

    const balance = getDisplayBalance('group2');
    expect(balance).toBe('€200.75');
  });

  it('handles small balance with threshold', () => {
    arrange();
    const { result } = renderHook(() =>
      useSingleWalletAccountsBalanceCallback('wallet1'),
    );
    const getDisplayBalance = result.current;

    const balance = getDisplayBalance('group3');
    expect(balance).toBe('<$0.01');
  });

  it('returns undefined for missing group', () => {
    arrange();
    const { result } = renderHook(() =>
      useSingleWalletAccountsBalanceCallback('wallet1'),
    );
    const getDisplayBalance = result.current;

    const balance = getDisplayBalance('nonexistent');
    expect(balance).toBeUndefined();
  });

  it('handles wallet with no groups', () => {
    const walletBalance = {
      totalBalanceInUserCurrency: 500.25,
      userCurrency: 'USD',
      groups: {},
    };
    arrange(walletBalance as MockVar);
    const { result } = renderHook(() =>
      useSingleWalletAccountsBalanceCallback('wallet1'),
    );
    const getDisplayBalance = result.current;

    const balance = getDisplayBalance('group1');
    expect(balance).toBeUndefined();
  });

  it('handles wallet with null groups', () => {
    const walletBalance = {
      totalBalanceInUserCurrency: 500.25,
      userCurrency: 'USD',
      groups: null,
    } as MockVar;
    arrange(walletBalance);
    const { result } = renderHook(() =>
      useSingleWalletAccountsBalanceCallback('wallet1'),
    );
    const getDisplayBalance = result.current;

    const balance = getDisplayBalance('group1');
    expect(balance).toBeUndefined();
  });
});
