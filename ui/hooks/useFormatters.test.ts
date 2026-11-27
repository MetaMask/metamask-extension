import { renderHook, act } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { useFormatters } from './useFormatters';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

const mockUseSelector = useSelector as unknown as jest.Mock;

describe('useFormatters', () => {
  let languagesSpy: jest.SpyInstance;

  beforeEach(() => {
    languagesSpy = jest.spyOn(navigator, 'languages', 'get');
  });

  afterEach(() => {
    languagesSpy.mockRestore();
  });

  it('combines app language with browser region for formatting', () => {
    mockUseSelector.mockReturnValue('en');
    languagesSpy.mockReturnValue(['de-DE']);

    const { result } = renderHook(() => useFormatters());

    // Fixed UTC timestamp at midday to avoid date boundary issues
    const timestamp = new Date('2024-03-15T12:00:00Z').getTime();

    // en-DE uses day-month-year order: "15 Mar 2024"
    // en-US would use month-day-year: "Mar 15, 2024"
    expect(
      result.current.formatMediumDate(timestamp, { timeZone: 'UTC' }),
    ).toBe('15 Mar 2024');
  });

  it('updates formatters when browser languages change', () => {
    mockUseSelector.mockReturnValue('en');
    languagesSpy.mockReturnValue(['en-US']);

    const { result } = renderHook(() => useFormatters());

    expect(result.current.formatNumber(1234.5)).toBe('1,234.5');

    act(() => {
      languagesSpy.mockReturnValue(['de-DE']);
      window.dispatchEvent(new Event('languagechange'));
    });

    expect(result.current.formatNumber(1234.5)).toBe('1.234,5');
  });
});
