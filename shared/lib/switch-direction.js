/**
 * Switch the CSS rules used between 'rtl' and 'ltr'
 *
 * @param {('ltr' | 'rtl' | 'auto')} direction - Text direction, either left-to-right (ltr) or right-to-left (rtl)
 */
export const switchDirection = (direction) => {
  document.documentElement.dir = direction === 'auto' ? 'ltr' : direction;
};

export const switchDirectionForPreferredLocale = (preferredLocale) => {
  const textDirection = ['ar', 'dv', 'fa', 'he', 'ku'].includes(preferredLocale)
    ? 'rtl'
    : 'auto';

  switchDirection(textDirection);
};
