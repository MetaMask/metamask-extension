import { resolveFormattingLocale } from './locale';

describe('locale helpers', () => {
  describe('resolveFormattingLocale', () => {
    // @ts-expect-error This is missing from the Mocha type definitions
    it.each([
      {
        name: 'combines English app language with German region',
        appLanguage: 'en',
        deviceLocales: ['de-DE'],
        expected: 'en-DE',
      },
      {
        name: 'finds first device locale with region',
        appLanguage: 'en',
        deviceLocales: ['en', 'de-DE'],
        expected: 'en-DE',
      },
      {
        name: 'uses device locale when language matches',
        appLanguage: 'de',
        deviceLocales: ['de-CH'],
        expected: 'de-CH',
      },
      {
        name: 'maps underscore locale to canonical form with device region',
        appLanguage: 'zh_TW',
        deviceLocales: ['zh-TW'],
        expected: 'zh-TW',
      },
      {
        name: 'preserves app script with different device region',
        appLanguage: 'zh_TW',
        deviceLocales: ['zh-CN'],
        expected: 'zh-Hant-CN',
      },
      {
        name: 'returns app language when no device locales',
        appLanguage: 'en',
        deviceLocales: [],
        expected: 'en',
      },
      {
        name: 'returns en on invalid input',
        appLanguage: 'invalid!!!',
        deviceLocales: ['en-US'],
        expected: 'en',
      },
      {
        name: 'preserves Hans script when region implies different script',
        appLanguage: 'zh_CN',
        deviceLocales: ['zh-TW'],
        expected: 'zh-Hans-TW',
      },
    ])(
      '$name',
      ({
        appLanguage,
        deviceLocales,
        expected,
      }: {
        appLanguage: string;
        deviceLocales: string[];
        expected: string;
      }) => {
        const result = resolveFormattingLocale({
          appLanguage,
          deviceLocales,
        });
        expect(result).toBe(expected);
      },
    );
  });
});
