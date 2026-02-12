import { renderHook } from '@testing-library/react-hooks';
import { useSelector } from 'react-redux';
import { getIntlLocale } from '../../ducks/locale/locale';
import { getCurrentCurrency } from '../../ducks/metamask/metamask';
import { useDisplayBalanceCalc } from './useAccountBalance';

jest.mock('react-redux');
jest.mock('../../selectors/assets');
jest.mock('../../ducks/metamask/metamask');
jest.mock('../../ducks/locale/locale');
jest.mock('../../selectors/multichain-accounts/account-tree');

const mockUseSelector = jest.mocked(useSelector);
const mockGetCurrentCurrency = jest.mocked(getCurrentCurrency);
const mockGetIntlLocale = jest.mocked(getIntlLocale);

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
