import type { Action } from 'redux';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import locales from '../../../app/_locales/index.json';
import testData from '../../../test/data/mock-state.json';

import * as actionConstants from '../../store/actionConstants';
import reduceLocaleMessages, {
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

  describe('reduceLocaleMessages', () => {
    it('should return initial state', () => {
      const unknownAction: Action = { type: 'UNKNOWN_ACTION' };
      expect(reduceLocaleMessages(undefined, unknownAction as never)).toEqual(
        {},
      );
    });

    it('should handle SET_CURRENT_LOCALE with English messages', () => {
      const initialState = {
        currentLocale: 'en',
        current: { hello: 'Hello' },
        en: { hello: 'Hello', goodbye: 'Goodbye' },
      };

      const action = {
        type: actionConstants.SET_CURRENT_LOCALE,
        payload: {
          locale: 'es',
          messages: { hello: 'Hola' },
          enMessages: {
            hello: 'Hello',
            goodbye: 'Goodbye',
            welcome: 'Welcome',
          },
        },
      };

      const newState = reduceLocaleMessages(initialState, action);

      expect(newState).toEqual({
        currentLocale: 'es',
        current: { hello: 'Hola' },
        en: { hello: 'Hello', goodbye: 'Goodbye', welcome: 'Welcome' },
      });
    });

    it('should handle SET_CURRENT_LOCALE without English messages and preserve existing', () => {
      const initialState = {
        currentLocale: 'en',
        current: { hello: 'Hello' },
        en: { hello: 'Hello', goodbye: 'Goodbye' },
      };

      const action = {
        type: actionConstants.SET_CURRENT_LOCALE,
        payload: {
          locale: 'es',
          messages: { hello: 'Hola' },
        },
      };

      const newState = reduceLocaleMessages(initialState, action);

      expect(newState).toEqual({
        currentLocale: 'es',
        current: { hello: 'Hola' },
        en: { hello: 'Hello', goodbye: 'Goodbye' },
      });
    });

    it('should handle SET_CURRENT_LOCALE when no English messages exist in state', () => {
      const initialState = {
        currentLocale: 'en',
        current: { hello: 'Hello' },
      };

      const action = {
        type: actionConstants.SET_CURRENT_LOCALE,
        payload: {
          locale: 'es',
          messages: { hello: 'Hola' },
          enMessages: { hello: 'Hello', goodbye: 'Goodbye' },
        },
      };

      const newState = reduceLocaleMessages(initialState, action);

      expect(newState).toEqual({
        currentLocale: 'es',
        current: { hello: 'Hola' },
        en: { hello: 'Hello', goodbye: 'Goodbye' },
      });
    });
  });
});
