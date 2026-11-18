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
    // 80% line height and -2% tracking. The md: classes keep those metrics
    // when the variant switches to its large-screen leading and tracking.
    // from-font keeps fallback metrics aligned with Grotzec while it loads.
    // TODO: @MetaMask/design-system-engineers !important for now will review why these overrides are not working as expected
    className={twMerge(
      'text-balance [font-size-adjust:from-font] !leading-[0.8] !tracking-[-0.02em] md:!leading-[0.8] md:!tracking-[-0.02em]',
      className,
    )}
  >
    {children}
  </Text>
);
