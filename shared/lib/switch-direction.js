/**
 * Switch the CSS rules used between 'rtl' and 'ltr'
 *
 * @param {('ltr' | 'rtl' | 'auto')} direction - Text direction, either left-to-right (ltr) or right-to-left (rtl)
 */
const switchDirection = (direction) => {
  document.documentElement.dir = direction === 'auto' ? 'ltr' : direction;
};

export default switchDirection;
