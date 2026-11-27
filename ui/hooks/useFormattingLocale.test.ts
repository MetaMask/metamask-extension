import { renderHook, act } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { useFormattingLocale } from './useFormattingLocale';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

const mockUseSelector = useSelector as unknown as jest.Mock;

describe('useFormattingLocale', () => {
  let languagesSpy: jest.SpyInstance;

  beforeEach(() => {
    mockUseSelector.mockReturnValue('en');
    languagesSpy = jest.spyOn(navigator, 'languages', 'get');
  });

  afterEach(() => {
    languagesSpy.mockRestore();
  });

  it('combines app language with browser region', () => {
    languagesSpy.mockReturnValue(['de-DE']);

    const { result } = renderHook(() => useFormattingLocale());

    expect(result.current).toBe('en-DE');
  });

  it('updates when browser languages change', () => {
    languagesSpy.mockReturnValue(['de-DE']);

    const { result } = renderHook(() => useFormattingLocale());

    act(() => {
      languagesSpy.mockReturnValue(['fr-CA']);
      window.dispatchEvent(new Event('languagechange'));
    });

    expect(result.current).toBe('en-CA');
  });
});
