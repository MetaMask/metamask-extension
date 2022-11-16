/**
 * Switch the CSS stylesheet used between 'rtl' and 'ltr'
 *
 * @param {('ltr' | 'rtl' | 'auto')} direction - Text direction, either left-to-right (ltr) or right-to-left (rtl)
 * @returns {Promise<void>}
 */
const switchDirection = async (direction) => {
  if (direction === 'auto') {
    // eslint-disable-next-line no-param-reassign
    direction = 'ltr';
  }

  let updatedLink;
  [...document.querySelectorAll('link[rel=stylesheet]')].forEach((link) => {
    if (link.title === direction && link.disabled) {
      link.disabled = false;
      updatedLink = link;
    } else if (link.title !== direction && !link.disabled) {
      link.disabled = true;
    }
  });

  if (updatedLink) {
    return new Promise((resolve, reject) => {
      updatedLink.onload = () => {
        resolve();
      };
      updatedLink.onerror = () =>
        reject(new Error(`Failed to load '${direction}' stylesheet`));
    });
  }

  return undefined;
};

export default switchDirection;
