import type { CSSProperties } from 'react';
import {
  FontFamily,
  FontWeight,
  TextVariant,
} from '@metamask/design-system-react';

/**
 * App languages whose glyphs fit in Grotzec Cond Bold.
 * Vietnamese is Latin but its tone marks are not in the font.
 */
const GROTZEC_LANGUAGE_CODES = new Set([
  'de',
  'en',
  'es',
  'fr',
  'id',
  'pt',
  'tl',
  'tr',
]);

/**
 * 80% line height and -2% tracking. Inline so they replace the variant's
 * leading and tracking classes.
 */
const HERO_TITLE_STYLE: CSSProperties = {
  lineHeight: 0.8,
  letterSpacing: '-0.02em',
};

/**
 * Smaller variant used when Grotzec cannot draw the language. Headings keep
 * their size, so this is set only for the Display sizes.
 */
const UNSUPPORTED_DISPLAY_VARIANT: Partial<Record<TextVariant, TextVariant>> = {
  [TextVariant.DisplayXl]: TextVariant.DisplayLg,
  [TextVariant.DisplayLg]: TextVariant.DisplayMd,
  [TextVariant.DisplayMd]: TextVariant.HeadingLg,
};

export type MarketingMomentTitlePresentation = {
  variant: TextVariant;
  fontFamily: FontFamily;
  fontWeight?: FontWeight;
  /**
   * Grotzec leading and tracking. Languages the font cannot draw leave this
   * unset and use the variant's own metrics.
   */
  style?: CSSProperties;
};

/**
 * Whether the app language can use Grotzec. `en-US` and `pt_BR` match on the
 * language subtag.
 *
 * @param locale - Active locale, such as `en` or `pt_BR`.
 * @returns True when the language is covered by Grotzec Cond Bold.
 */
export function supportsGrotzecLocale(
  locale: string | undefined | null,
): boolean {
  const language = (locale ?? '').toLowerCase().split(/[-_]/u)[0];
  return GROTZEC_LANGUAGE_CODES.has(language);
}

/**
 * Display metrics for a hero title. Grotzec locales keep the requested variant
 * and the tight hero metrics. Other locales use the default face and step
 * Display sizes down one level.
 *
 * @param supportsGrotzec - Result of {@link supportsGrotzecLocale}.
 * @param variant - Requested Display or Heading size. Defaults to DisplayXl.
 * @returns Variant, font family, and optional hero metrics.
 */
export function getMarketingMomentTitlePresentation(
  supportsGrotzec: boolean,
  variant: TextVariant = TextVariant.DisplayXl,
): MarketingMomentTitlePresentation {
  if (!supportsGrotzec) {
    return {
      variant: UNSUPPORTED_DISPLAY_VARIANT[variant] ?? variant,
      fontFamily: FontFamily.Default,
      fontWeight: FontWeight.Bold,
    };
  }

  return {
    variant,
    fontFamily: FontFamily.Hero,
    style: HERO_TITLE_STYLE,
  };
}
