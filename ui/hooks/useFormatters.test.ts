import { renderHook } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { narrowSymbolExempt } from '#shared/constants/locales';
import { useFormatters } from '#ui/hooks/useFormatters';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

const mockUseSelector = useSelector as jest.Mock;
const OriginalNumberFormat = Intl.NumberFormat;

function mockDeviceLocale(locale: string) {
  jest.spyOn(Intl, 'NumberFormat').mockImplementation(((
    locales?: Intl.LocalesArgument,
    options?: Intl.NumberFormatOptions,
  ) => {
    if (locales === undefined) {
      return new OriginalNumberFormat(locale);
    }
    return new OriginalNumberFormat(locales as string, options);
  }) as unknown as typeof Intl.NumberFormat);
}

function formatUsd(locale: string, currencyDisplay: 'symbol' | 'narrowSymbol') {
  return new OriginalNumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    currencyDisplay,
  }).format(1);
}

describe('useFormatters', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('does not use narrowSymbol for an exempt region', () => {
    for (const region of narrowSymbolExempt) {
      mockUseSelector.mockReturnValue('en');
      mockDeviceLocale(`en-${region}`);

      const { result } = renderHook(() => useFormatters());

      expect(result.current.formatCurrency(1, 'USD')).toBe(
        formatUsd(`en-${region}`, 'symbol'),
      );
      jest.restoreAllMocks();
    }
  });

  it('uses narrowSymbol for a region outside the exempt list', () => {
    mockUseSelector.mockReturnValue('es');
    mockDeviceLocale('en-GB');

    const { result } = renderHook(() => useFormatters());

    expect(result.current.formatCurrency(1, 'USD')).toBe(
      formatUsd('es', 'narrowSymbol'),
    );
  });
});
