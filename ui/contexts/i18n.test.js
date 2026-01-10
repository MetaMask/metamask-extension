import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../hooks/useI18nContext';
import { I18nProvider } from './i18n';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

describe('I18nProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fallback to English locale messages when current locale message is missing', () => {
    // Setup: current locale is Spanish, but only has 'hello' message
    // English has both 'hello' and 'goodbye' messages
    useSelector
      .mockReturnValueOnce('es') // getCurrentLocale
      .mockReturnValueOnce({ hello: { message: 'Hola' } }) // getCurrentLocaleMessages
      .mockReturnValueOnce({
        hello: { message: 'Hello' },
        goodbye: { message: 'Goodbye' },
      }); // getEnLocaleMessages

    const wrapper = ({ children }) => <I18nProvider>{children}</I18nProvider>;

    const { result } = renderHook(() => useI18nContext(), { wrapper });

    // Should get Spanish translation for 'hello'
    expect(result.current('hello')).toBe('Hola');

    // Should fallback to English translation for 'goodbye'
    expect(result.current('goodbye')).toBe('Goodbye');
  });

  it('should use current locale messages when available', () => {
    // Setup: current locale has all messages
    useSelector
      .mockReturnValueOnce('es') // getCurrentLocale
      .mockReturnValueOnce({
        hello: { message: 'Hola' },
        goodbye: { message: 'Adiós' },
      }) // getCurrentLocaleMessages
      .mockReturnValueOnce({
        hello: { message: 'Hello' },
        goodbye: { message: 'Goodbye' },
      }); // getEnLocaleMessages

    const wrapper = ({ children }) => <I18nProvider>{children}</I18nProvider>;

    const { result } = renderHook(() => useI18nContext(), { wrapper });

    // Should get Spanish translations
    expect(result.current('hello')).toBe('Hola');
    expect(result.current('goodbye')).toBe('Adiós');
  });

  it('should handle case when English locale messages are not available', () => {
    // Setup: only current locale is available
    useSelector
      .mockReturnValueOnce('es') // getCurrentLocale
      .mockReturnValueOnce({ hello: { message: 'Hola' } }) // getCurrentLocaleMessages
      .mockReturnValueOnce(undefined); // getEnLocaleMessages

    const wrapper = ({ children }) => <I18nProvider>{children}</I18nProvider>;

    const { result } = renderHook(() => useI18nContext(), { wrapper });

    // Should get Spanish translation for 'hello'
    expect(result.current('hello')).toBe('Hola');

    // Should return null for missing key
    expect(result.current('goodbye')).toBeNull();
  });
});
