// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import locales from '../../../app/_locales/index.json';
import testData from '../../../test/data/mock-state.json';
import * as actionConstants from '../../store/actionConstants';

import reducer, {
  getCurrentLocale,
  getIntlLocale,
  getCurrentLocaleMessages,
  getEnLocaleMessages,
} from './locale';

// Mock state creation functions
const createMockStateWithLocale = (locale: string) => ({
  localeMessages: { currentLocale: locale },
});

describe('Locale Selectors', () => {
  describe('getCurrentLocale', () => {
    it('returns the current locale from the state', () => {
      expect(getCurrentLocale(testData)).toBe('en');
    });

    it('returns undefined if no current locale is set', () => {
      const newAppState = {
        ...testData,
        localeMessages: {
          currentLocale: undefined,
        },
      };
      expect(getCurrentLocale(newAppState)).toBeUndefined();
    });
  });

  describe('getIntlLocale', () => {
    it('returns the canonical BCP 47 language tag for the currently selected locale', () => {
      const mockState = createMockStateWithLocale('en_US');
      expect(getIntlLocale(mockState)).toBe('en-US');
    });

    locales.forEach((locale: { code: string; name: string }) => {
      it(`handles supported locale - "${locale.code}"`, () => {
        const mockState = createMockStateWithLocale(locale.code);
        expect(() => getIntlLocale(mockState)).not.toThrow();
      });
    });
  });

  describe('getCurrentLocaleMessages', () => {
    it('returns the current locale messages from the state', () => {
      expect(getCurrentLocaleMessages(testData)).toEqual({ user: 'user' });
    });

    it('returns undefined if there are no current locale messages', () => {
      const newAppState = {
        ...testData,
        localeMessages: {
          current: undefined,
        },
      };
      expect(getCurrentLocaleMessages(newAppState)).toEqual(undefined);
    });
  });

  describe('getEnLocaleMessages', () => {
    it('returns the English locale messages from the state', () => {
      expect(getEnLocaleMessages(testData)).toEqual({ user: 'user' });
    });

    it('returns undefined if there are no English locale messages', () => {
      const newAppState = {
        ...testData,
        localeMessages: {
          en: undefined,
        },
      };
      expect(getEnLocaleMessages(newAppState)).toBeUndefined();
    });
  });
});

describe('localeMessages reducer', () => {
  const baseMessages = {
    foo: { message: 'bar' },
  };

  it('persists provided fallback messages', () => {
    const fallback = {
      baz: { message: 'qux' },
    };
    const result = reducer(undefined, {
      type: actionConstants.SET_CURRENT_LOCALE,
      payload: {
        locale: 'es',
        messages: baseMessages,
        fallbackMessages: fallback,
      },
    });

    expect(result.en).toStrictEqual(fallback);
  });

  it('defaults fallback to locale messages when locale is fallback', () => {
    const result = reducer(undefined, {
      type: actionConstants.SET_CURRENT_LOCALE,
      payload: {
        locale: 'en',
        messages: baseMessages,
      },
    });

    expect(result.en).toStrictEqual(baseMessages);
  });

  it('retains previous fallback when none provided', () => {
    const previousState = {
      en: { hello: { message: 'world' } },
    };

    const result = reducer(previousState, {
      type: actionConstants.SET_CURRENT_LOCALE,
      payload: {
        locale: 'fr',
        messages: baseMessages,
      },
    });

    expect(result.en).toStrictEqual(previousState.en);
  });
});
