/**
 * Switch the CSS rules used between 'rtl' and 'ltr'
 *
 * @param {('ltr' | 'rtl' | 'auto')} direction - Text direction, either left-to-right (ltr) or right-to-left (rtl)
 */
const switchDirection = (direction) => {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
  // eslint-disable-next-line no-restricted-globals
  document.documentElement.dir = direction === 'auto' ? 'ltr' : direction;
};

export default switchDirection;
