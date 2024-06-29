import locales from '../../../app/_locales/index.json';
import { getIntlLocale } from './locale';

const createMockStateWithLocale = (locale: string) => ({
  localeMessages: { currentLocale: locale },
});

describe('getIntlLocale', () => {
  it('returns the canonical BCP 47 language tag for the currently selected locale', () => {
    const mockState = createMockStateWithLocale('ab-cd');

    expect(getIntlLocale(mockState)).toBe('ab-CD');
  });

  it('throws an error if locale cannot be made into BCP 47 language tag', () => {
    const mockState = createMockStateWithLocale('xxxinvalid-locale');

    expect(() => getIntlLocale(mockState)).toThrow();
  });

  // @ts-expect-error This is missing from the Mocha type definitions
  it.each(locales)(
    'handles all supported locales – "%s"',
    (locale: { code: string; name: string }) => {
      const mockState = createMockStateWithLocale(locale.code);

      expect(() => getIntlLocale(mockState)).not.toThrow();
    },
  );
});
