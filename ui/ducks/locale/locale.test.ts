import locales from '../../../app/_locales/index.json';
import { getIntlLocale } from './locale';

const createMockStateWithLocale = (locale: string) => ({
  localeMessages: { currentLocale: locale },
});

describe('getIntlLocale', () => {
  it.each(locales)('can convert locale "%s" to BCP 47 format', (locale) => {
    const mockState = createMockStateWithLocale(locale.code);

    // Intl.getCanonicalLocales will throw an error if the locale is invalid.
    expect(() => getIntlLocale(mockState)).not.toThrow();
  });
});
