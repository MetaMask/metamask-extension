const RTL_LOCALES = ['ar', 'dv', 'fa', 'he', 'ku'] as const;

/**
 * Switch the CSS rules used between 'rtl' and 'ltr'
 *
 * @param direction - Text direction, either left-to-right (ltr) or right-to-left (rtl)
 */
export const switchDirection = (direction: 'ltr' | 'rtl' | 'auto'): void => {
  document.documentElement.dir = direction === 'auto' ? 'ltr' : direction;
};

export const switchDirectionForPreferredLocale = (
  preferredLocale: string,
): void => {
  const textDirection = (RTL_LOCALES as readonly string[]).includes(
    preferredLocale,
  )
    ? 'rtl'
    : 'auto';

  switchDirection(textDirection);
};
