import React from 'react';
import { useSelector } from 'react-redux';
import {
  Text,
  TextVariant,
  twMerge,
  type TextProps,
} from '@metamask/design-system-react';
import { getCurrentLocale } from '../../../ducks/locale/locale';
import {
  getMarketingMomentTitlePresentation,
  supportsGrotzecLocale,
} from './marketing-moment-title.utils';

/**
 * 80% line height and -2% tracking. The md: classes keep those metrics when
 * the variant switches to its large-screen leading and tracking.
 */
const HERO_TITLE_CLASSNAME =
  'text-balance leading-[0.8] tracking-[-0.02em] md:leading-[0.8] md:tracking-[-0.02em]';

/**
 * Active locale. Message locale wins. The preferences locale covers Storybook,
 * where translations come from the toolbar and `localeMessages` is unset.
 */
function useMarketingMomentLocale(): string {
  const localeFromMessages = useSelector(getCurrentLocale);
  const localeFromPreferences = useSelector(
    (state: { metamask?: { currentLocale?: string } }) =>
      state.metamask?.currentLocale,
  );

  return localeFromMessages || localeFromPreferences || 'en';
}

/**
 * Display title for a marketing moment. Grotzec languages use the hero face
 * and the template's tight metrics for the requested size. Every other
 * language uses the default face, and Display sizes step down one level.
 *
 * @param props - Design-system text props. `variant` selects the hero size.
 * @param props.variant
 * @param props.className
 * @param props.children
 */
export const MarketingMomentTitle = ({
  variant = TextVariant.DisplayLg,
  className,
  children,
  ...props
}: TextProps) => {
  const supportsGrotzec = supportsGrotzecLocale(useMarketingMomentLocale());
  const presentation = getMarketingMomentTitlePresentation(
    supportsGrotzec,
    variant,
  );

  return (
    <Text
      {...props}
      variant={presentation.variant}
      fontFamily={presentation.fontFamily}
      fontWeight={presentation.fontWeight}
      className={twMerge(
        supportsGrotzec ? HERO_TITLE_CLASSNAME : undefined,
        className,
      )}
    >
      {children}
    </Text>
  );
};
