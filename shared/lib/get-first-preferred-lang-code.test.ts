import browser from 'webextension-polyfill';
import getFirstPreferredLangCode from './get-first-preferred-lang-code';

jest.mock('webextension-polyfill', () => ({
  i18n: {
    getAcceptLanguages: jest.fn(),
  },
}));

const mockGetAcceptLanguages = browser.i18n
  .getAcceptLanguages as jest.MockedFunction<
  typeof browser.i18n.getAcceptLanguages
>;

describe('getFirstPreferredLangCode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the first supported locale from the preferred list', async () => {
    mockGetAcceptLanguages.mockResolvedValue(['fr', 'de']);

    const result = await getFirstPreferredLangCode();

    expect(result).toBe('fr');
  });

  it('returns the first supported locale when earlier entries are unsupported', async () => {
    mockGetAcceptLanguages.mockResolvedValue(['xx', 'yy', 'de']);

    const result = await getFirstPreferredLangCode();

    expect(result).toBe('de');
  });

  it('returns en when no preferred locale is supported', async () => {
    mockGetAcceptLanguages.mockResolvedValue(['xx', 'yy']);

    const result = await getFirstPreferredLangCode();

    expect(result).toBe('en');
  });

  it('returns en when the preferred locales list is empty', async () => {
    mockGetAcceptLanguages.mockResolvedValue([]);

    const result = await getFirstPreferredLangCode();

    expect(result).toBe('en');
  });

  describe('when getAcceptLanguages throws (Brave browser)', () => {
    beforeEach(() => {
      jest.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    afterEach(() => {
      jest.mocked(console.error).mockRestore();
    });

    it('returns en', async () => {
      mockGetAcceptLanguages.mockRejectedValue(new Error('Not implemented'));

      const result = await getFirstPreferredLangCode();

      expect(result).toBe('en');
    });
  });

  describe('when getAcceptLanguages returns undefined', () => {
    it('returns en', async () => {
      mockGetAcceptLanguages.mockResolvedValue(
        undefined as unknown as string[],
      );

      const result = await getFirstPreferredLangCode();

      expect(result).toBe('en');
    });
  });

  describe('Chinese locale handling', () => {
    it('maps zh to zh_CN via the pre-seeded default', async () => {
      mockGetAcceptLanguages.mockResolvedValue(['zh']);

      const result = await getFirstPreferredLangCode();

      expect(result).toBe('zh_CN');
    });

    it('maps zh-cn (hyphen form) to zh_CN', async () => {
      mockGetAcceptLanguages.mockResolvedValue(['zh-cn']);

      const result = await getFirstPreferredLangCode();

      expect(result).toBe('zh_CN');
    });

    it('maps zh-tw (hyphen form) to zh_TW', async () => {
      mockGetAcceptLanguages.mockResolvedValue(['zh-tw']);

      const result = await getFirstPreferredLangCode();

      expect(result).toBe('zh_TW');
    });
  });

  describe('regional code fallback', () => {
    it('falls back to the base language code when only the base locale is supported', async () => {
      // fr-CA is not a supported locale but fr is; the result should be fr
      mockGetAcceptLanguages.mockResolvedValue(['fr-CA']);

      const result = await getFirstPreferredLangCode();

      expect(result).toBe('fr');
    });
  });

  describe('locale code normalisation', () => {
    it('is case-insensitive for locale codes', async () => {
      mockGetAcceptLanguages.mockResolvedValue(['FR']);

      const result = await getFirstPreferredLangCode();

      expect(result).toBe('fr');
    });

    it('normalises underscores to hyphens before matching', async () => {
      // Some browsers may return zh_TW; the module lowercases and replaces '_' with '-'
      mockGetAcceptLanguages.mockResolvedValue(['zh_TW']);

      const result = await getFirstPreferredLangCode();

      expect(result).toBe('zh_TW');
    });
  });
});
