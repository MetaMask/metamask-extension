import { renderHook } from '@testing-library/react-hooks';
import { getIntlLocale } from '../ducks/locale/locale';
import { getCurrentCurrency } from '../ducks/metamask/metamask';
import { useFiatFormatter } from './useFiatFormatter';

jest.mock('react-redux', () => ({
  useSelector: jest.fn((selector) => selector()),
}));

jest.mock('../ducks/locale/locale', () => ({
  getIntlLocale: jest.fn(),
}));

jest.mock('../ducks/metamask/metamask', () => ({
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

  describe('shorten the fiat', () => {
    it('when currency symbol on the left for given locale', () => {
      mockGetIntlLocale.mockReturnValue('en-US');
      mockGetCurrentCurrency.mockReturnValue('USD');

      const { result } = renderHook(() => useFiatFormatter());
      const formatFiat = result.current;

      expect(formatFiat(100000000000000000, { shorten: true })).toBe(
        '$100,000,000,...',
      );
    });

    it('when currency symbol on the right for given locale', () => {
      mockGetIntlLocale.mockReturnValue('es-ES');
      mockGetCurrentCurrency.mockReturnValue('EUR');

      const { result } = renderHook(() => useFiatFormatter());
      const formatFiat = result.current;

      expect(formatFiat(100000000000000000, { shorten: true })).toBe(
        '100.000.000....€',
      );
    });

    it('handle unknown currencies by returning amount followed by currency code', () => {
      mockGetCurrentCurrency.mockReturnValue('storj');
      mockGetIntlLocale.mockReturnValue('en-US');

      const { result } = renderHook(() => useFiatFormatter());
      const formatFiat = result.current;

      expect(formatFiat(100000, { shorten: true })).toBe('100,000 storj');
      expect(formatFiat(500.5, { shorten: true })).toBe('500.5 storj');
      expect(formatFiat(0, { shorten: true })).toBe('0 storj');
    });
  });

  it('should use the current locale and currency from the mocked functions', () => {
    mockGetIntlLocale.mockReturnValue('fr-FR');
    mockGetCurrentCurrency.mockReturnValue('EUR');

    renderHook(() => useFiatFormatter());

    expect(getIntlLocale).toHaveBeenCalledTimes(1);
    expect(getCurrentCurrency).toHaveBeenCalledTimes(1);
  });

  it('should gracefully handle unknown currencies by returning amount followed by currency code', () => {
    mockGetCurrentCurrency.mockReturnValue('storj');
    mockGetIntlLocale.mockReturnValue('en-US');

    const { result } = renderHook(() => useFiatFormatter());
    const formatFiat = result.current;

    // Testing the fallback formatting for an unknown currency
    expect(formatFiat(100000)).toBe('100,000 storj');
    expect(formatFiat(500.5)).toBe('500.5 storj');
    expect(formatFiat(0)).toBe('0 storj');
  });
});
