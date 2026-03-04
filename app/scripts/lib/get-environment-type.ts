import { memoize } from 'lodash';
import {
  ENVIRONMENT_TYPE_BACKGROUND,
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_NOTIFICATION,
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_SIDEPANEL,
} from '../../../shared/constants/app';

/**
 * @see {@link getEnvironmentType}
 */
const getEnvironmentTypeMemo = memoize((url: string) => {
  const parsedUrl = new URL(url);
  if (parsedUrl.pathname === '/popup.html') {
    return ENVIRONMENT_TYPE_POPUP;
  } else if (['/home.html'].includes(parsedUrl.pathname)) {
    return ENVIRONMENT_TYPE_FULLSCREEN;
  } else if (parsedUrl.pathname === '/notification.html') {
    return ENVIRONMENT_TYPE_NOTIFICATION;
  } else if (parsedUrl.pathname === '/sidepanel.html') {
    return ENVIRONMENT_TYPE_SIDEPANEL;
  }
  return ENVIRONMENT_TYPE_BACKGROUND;
});

/**
 * Returns the window type for the application
 *
 * - `popup` refers to the extension opened through the browser app icon (in top right corner in chrome and firefox)
 * - `fullscreen` refers to the main browser window
 * - `notification` refers to the popup that appears in its own window when taking action outside of metamask
 * - `background` refers to the background page
 *
 * NOTE: This should only be called on internal URLs.
 *
 * @param [url] - the URL of the window
 * @returns the environment ENUM
 */
export const getEnvironmentType = (
  url = globalThis.self?.location?.href ?? '',
): string => {
  if (!url) {
    return ENVIRONMENT_TYPE_BACKGROUND;
  }
  return getEnvironmentTypeMemo(url);
};
