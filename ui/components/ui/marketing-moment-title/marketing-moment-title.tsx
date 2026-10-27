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
 * Size from the title's container, not the viewport. DisplayLg's `md:` size
 * is 60px, which overflows a ~400px dialog when the window is wide. 9.5cqw
 * matches the size that fits the longest hero word, and the cap is the large
 * display size once the container is actually wide enough.
 */
const HERO_TITLE_FONT_SIZE = 'clamp(1.75rem, 9.5cqw, 3.75rem)';

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
 * @param props.style
 * @param props.children
 */
export const MarketingMomentTitle = ({
  variant = TextVariant.DisplayLg,
  className,
  style,
  children,
  ...props
}: TextProps) => {
  const supportsGrotzec = supportsGrotzecLocale(useMarketingMomentLocale());
  const presentation = getMarketingMomentTitlePresentation(
    supportsGrotzec,
    variant,
  );

  return (
    <div className="w-full min-w-0" style={{ containerType: 'inline-size' }}>
      <Text
        {...props}
        variant={presentation.variant}
        fontFamily={presentation.fontFamily}
        fontWeight={presentation.fontWeight}
        className={twMerge(
          'w-full min-w-0 max-w-full break-words text-balance',
          className,
        )}
        style={{
          ...(supportsGrotzec
            ? { lineHeight: 0.8, letterSpacing: '-0.02em' }
            : undefined),
          ...style,
          fontSize: HERO_TITLE_FONT_SIZE,
        }}
      >
        {children}
      </Text>
    </div>
  );
};
