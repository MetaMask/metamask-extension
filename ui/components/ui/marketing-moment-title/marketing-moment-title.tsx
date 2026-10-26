import React from 'react';
import {
  FontFamily,
  Text,
  TextVariant,
  type TextProps,
} from '@metamask/design-system-react';

/**
 * 80% line height and -2% tracking. Inline so they replace the variant's
 * leading and tracking classes. The hero font stack falls back when a
 * language is not covered by Grotzec.
 */
const HERO_TITLE_STYLE = {
  lineHeight: 0.8,
  letterSpacing: '-0.02em',
} as const;

/**
 * Display title for a marketing moment. Uses the hero face and tight metrics
 * for the requested size. The browser falls back when Grotzec does not cover
 * the language.
 *
 * @param props - Design-system text props. `variant` selects the hero size.
 * @param props.variant
 * @param props.style
 * @param props.className
 * @param props.children
 */
export const MarketingMomentTitle = ({
  variant = TextVariant.DisplayXl,
  style,
  className,
  children,
  ...props
}: TextProps) => (
  <Text
    {...props}
    variant={variant}
    fontFamily={FontFamily.Hero}
    className={className}
    style={{ ...HERO_TITLE_STYLE, ...style }}
  >
    {children}
  </Text>
);
