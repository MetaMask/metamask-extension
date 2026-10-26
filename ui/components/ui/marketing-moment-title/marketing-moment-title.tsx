import React from 'react';
import { useSelector } from 'react-redux';
import { Text, type TextProps } from '@metamask/design-system-react';
import { getCurrentLocale } from '../../../ducks/locale/locale';
import {
  getMarketingMomentTitlePresentation,
  supportsGrotzecLocale,
} from './marketing-moment-title.utils';

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
 * and tight metrics for the requested Display or Heading size. Every other
 * language uses the default face, and Display sizes step down one level.
 *
 * @param props - Design-system text props. `variant` selects the hero size.
 * @param props.variant
 * @param props.style
 * @param props.className
 * @param props.children
 */
export const MarketingMomentTitle = ({
  variant,
  style,
  className,
  children,
  ...props
}: TextProps) => {
  const locale = useMarketingMomentLocale();
  const presentation = getMarketingMomentTitlePresentation(
    supportsGrotzecLocale(locale),
    variant,
  );
  const titleStyle = {
    ...presentation.style,
    ...style,
  };

  return (
    <Text
      {...props}
      variant={presentation.variant}
      fontFamily={presentation.fontFamily}
      fontWeight={presentation.fontWeight}
      className={className}
      style={Object.keys(titleStyle).length > 0 ? titleStyle : undefined}
    >
      {children}
    </Text>
  );
};
