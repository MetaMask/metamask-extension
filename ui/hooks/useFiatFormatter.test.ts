import { renderHook } from '@testing-library/react-hooks';
import { getIntlLocale } from '../ducks/locale/locale';
import { getCurrentCurrency } from '../selectors';
import { useFiatFormatter } from './useFiatFormatter';

jest.mock('react-redux', () => ({
  useSelector: jest.fn((selector) => selector()),
}));

jest.mock('../ducks/locale/locale', () => ({
  getIntlLocale: jest.fn(),
}));

jest.mock('../selectors', () => ({
  getCurrentCurrency: jest.fn(),
}));

const mockGetIntlLocale = getIntlLocale as unknown as jest.Mock;
const mockGetCurrentCurrency = getCurrentCurrency as jest.Mock;

describe('useFiatFormatter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return a function that formats fiat amount correctly', () => {
    mockGetIntlLocale.mockReturnValue('en-US');
    mockGetCurrentCurrency.mockReturnValue('USD');

    const { result } = renderHook(() => useFiatFormatter());
    const formatFiat = result.current;

    expect(formatFiat(1000)).toBe('$1,000.00');
    expect(formatFiat(500.5)).toBe('$500.50');
    expect(formatFiat(0)).toBe('$0.00');
  });

  it('should use the current locale and currency from the mocked functions', () => {
    mockGetIntlLocale.mockReturnValue('fr-FR');
    mockGetCurrentCurrency.mockReturnValue('EUR');

    renderHook(() => useFiatFormatter());

    expect(getIntlLocale).toHaveBeenCalledTimes(1);
    expect(getCurrentCurrency).toHaveBeenCalledTimes(1);
  });
});
