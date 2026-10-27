import React from 'react';
import {
  FontFamily,
  Text,
  TextVariant,
  twMerge,
  type TextProps,
} from '@metamask/design-system-react';

/**
 * Display title for a marketing moment. Uses the hero face and tight metrics
 * for the requested size. The browser falls back when Grotzec does not cover
 * the language.
 *
 * @param props - Design-system text props. `variant` selects the hero size.
 * @param props.variant
 * @param props.className
 * @param props.children
 */
export const MarketingMomentTitle = ({
  variant = TextVariant.DisplayXl,
  className,
  children,
  ...props
}: TextProps) => (
  <Text
    {...props}
    variant={variant}
    fontFamily={FontFamily.Hero}
    // 80% line height and -2% tracking. These replace the variant's leading
    // and tracking classes. The hero font stack falls back when a language is
    // not covered by Grotzec.
    className={twMerge('leading-[0.8] tracking-[-0.02em]', className)}
  >
    {children}
  </Text>
);
