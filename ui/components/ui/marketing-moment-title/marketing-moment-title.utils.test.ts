import { it } from '@jest/globals';
import {
  FontFamily,
  FontWeight,
  TextVariant,
} from '@metamask/design-system-react';
import {
  getMarketingMomentTitlePresentation,
  supportsGrotzecLocale,
} from './marketing-moment-title.utils';

describe('supportsGrotzecLocale', () => {
  it.each(['de', 'en', 'es', 'fr', 'id', 'pt', 'tl', 'tr'])(
    'accepts %s',
    (locale) => {
      expect(supportsGrotzecLocale(locale)).toBe(true);
    },
  );

  it('matches the language subtag of a regional locale', () => {
    expect(supportsGrotzecLocale('en-US')).toBe(true);
    expect(supportsGrotzecLocale('pt_BR')).toBe(true);
    expect(supportsGrotzecLocale('EN')).toBe(true);
  });

  it.each(['el', 'hi', 'ja', 'ko', 'ru', 'vi', 'zh'])(
    'rejects %s',
    (locale) => {
      expect(supportsGrotzecLocale(locale)).toBe(false);
    },
  );

  it('rejects a missing locale', () => {
    expect(supportsGrotzecLocale(undefined)).toBe(false);
    expect(supportsGrotzecLocale(null)).toBe(false);
    expect(supportsGrotzecLocale('')).toBe(false);
  });
});

describe('getMarketingMomentTitlePresentation', () => {
  it.each([
    TextVariant.DisplayLg,
    TextVariant.DisplayMd,
    TextVariant.HeadingLg,
    TextVariant.HeadingMd,
    TextVariant.HeadingSm,
  ])('keeps the requested size on the Grotzec face for %s', (variant) => {
    expect(getMarketingMomentTitlePresentation(true, variant)).toEqual({
      variant,
      fontFamily: FontFamily.Hero,
    });
  });

  it('defaults to DisplayLg on the Grotzec face', () => {
    expect(getMarketingMomentTitlePresentation(true)).toEqual({
      variant: TextVariant.DisplayLg,
      fontFamily: FontFamily.Hero,
    });
  });

  it.each([
    [TextVariant.DisplayLg, TextVariant.DisplayMd],
    [TextVariant.DisplayMd, TextVariant.HeadingLg],
    [TextVariant.HeadingLg, TextVariant.HeadingLg],
    [TextVariant.HeadingMd, TextVariant.HeadingMd],
    [TextVariant.HeadingSm, TextVariant.HeadingSm],
  ])(
    'steps %s to %s when Grotzec is not supported',
    (variant, unsupportedVariant) => {
      expect(getMarketingMomentTitlePresentation(false, variant)).toEqual({
        variant: unsupportedVariant,
        fontFamily: FontFamily.Default,
        fontWeight: FontWeight.Bold,
      });
    },
  );
});
