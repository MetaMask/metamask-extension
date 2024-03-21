import { useSelector } from 'react-redux';
import { renderHook } from '@testing-library/react-hooks';
import {useFiatFormatter} from './useFiatFormatter';
import { getCurrentLocale } from '../ducks/locale/locale';
import { getCurrentCurrency } from '../selectors';

// Mock the getCurrentLocale and getCurrentCurrency functions
jest.mock('react-redux', () => ({
  useSelector: jest.fn((selector) => selector()),
}));

jest.mock('../ducks/locale/locale', () => ({
  getCurrentLocale: jest.fn(),
}));

jest.mock('../selectors', () => ({
  getCurrentCurrency: jest.fn(),
}));

const mockGetCurrentLocale = getCurrentLocale as jest.Mock;
const mockGetCurrentCurrency = getCurrentCurrency as jest.Mock;

describe('useFiatFormatter', () => {
  beforeEach(() => {
    // Clear the mock implementations before each test
    mockGetCurrentLocale.mockClear();
    mockGetCurrentCurrency.mockClear();
  });

  it('should return a function that formats fiat amount correctly', () => {
    // Mock the getCurrentLocale and getCurrentCurrency functions
    mockGetCurrentLocale.mockReturnValue('en-US');
    mockGetCurrentCurrency.mockReturnValue('USD');

    const { result } = renderHook(() => useFiatFormatter());
    const formatFiat = result.current;

    expect(formatFiat(1000)).toBe('$1,000.00');
    expect(formatFiat(500.5)).toBe('$500.50');
    expect(formatFiat(0)).toBe('$0.00');
  });

  it('should use the current locale and currency from the mocked functions', () => {
    // Mock the getCurrentLocale and getCurrentCurrency functions
    mockGetCurrentLocale.mockReturnValue('fr-FR');
    mockGetCurrentCurrency.mockReturnValue('EUR');

    renderHook(() => useFiatFormatter());

    expect(getCurrentLocale).toHaveBeenCalledTimes(1);
    expect(getCurrentCurrency).toHaveBeenCalledTimes(1);
  });
});
