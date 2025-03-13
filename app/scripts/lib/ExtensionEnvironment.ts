import browser from 'webextension-polyfill';
import { createEnum } from './createEnum';

export type ExtensionEnvironment = Awaited<
  ReturnType<typeof getExtensionEnvironment>
>;

export type WindowType = Awaited<ReturnType<typeof getWindowType>>;

export const getWindowType = async () => {
  const windowInfo = await browser.windows.getCurrent?.();
  const tabInfo = await browser.tabs.getCurrent?.();

  if (windowInfo?.type === 'popup') return 'popup';
  if (tabInfo?.id) return 'tab';
  return 'unknown';
};

// Create the environment type enum
export const EnvironmentType = createEnum([
  'ActionPopup',
  'NotificationPopup',
  'FullPage',
  'ServiceWorker',
  'Offscreen',
  'ContentScript',
  'Unknown',
]);

export type EnvironmentType = typeof EnvironmentType.type;

export const isUI = (envType: EnvironmentType) =>
  [
    EnvironmentType.ActionPopup,
    EnvironmentType.NotificationPopup,
    EnvironmentType.FullPage,
  ].includes(envType);

export const isExtensionUrl = (url: URL) =>
  browser.runtime?.getURL?.('') === `${url.origin}/`;

export const isWebPage = (url: URL) =>
  ['http:', 'https:'].includes(url.protocol);

// Extension environment type detection
export const getEnvType = (url: URL): EnvironmentType => {
  // Check for content script environment first
  if (isWebPage(url)) {
    return EnvironmentType.ContentScript;
  }

  if (!isExtensionUrl(url)) {
    // Not an extension URL and not a content script
    // Devtools may fall into this category
    return EnvironmentType.Unknown;
  }

  // Handle extension URLs
  switch (url.pathname) {
    case '/popup.html':
      return EnvironmentType.ActionPopup;
    case '/notification.html':
      return EnvironmentType.NotificationPopup;
    case '/home.html':
      return EnvironmentType.FullPage;
    case '/offscreen.html':
      return EnvironmentType.Offscreen;
    // Service worker path differs per browser.
    case '/background.html':
    case '/scripts/app-init.js':
      return EnvironmentType.ServiceWorker;
    default:
      // Unknown extension path.
      return EnvironmentType.Unknown;
  }
};

export const getExtensionEnvironment = async () => {
  const url = new URL(window.location.href);
  const envType = getEnvType(url);

  const env = {
    type: envType,

    // Convenience flags
    isTypeActionPopup: envType === EnvironmentType.ActionPopup,
    isTypeNotificationPopup: envType === EnvironmentType.NotificationPopup,
    isTypeFullPage: envType === EnvironmentType.FullPage,
    isTypeOffscreen: envType === EnvironmentType.Offscreen,
    isTypeServiceWorker: envType === EnvironmentType.ServiceWorker,
    isTypeContentScript: envType === EnvironmentType.ContentScript,
    isTypeUnknown: envType === EnvironmentType.Unknown,
    isUI: isUI(envType),
  };

  const windowType = await getWindowType();

  const canAutoCloseThisWindow = windowType === 'popup';

  return {
    type: envType,

    // Convenience flags
    isTypeActionPopup: envType === EnvironmentType.ActionPopup,
    isTypeNotificationPopup: envType === EnvironmentType.NotificationPopup,
    isTypeFullPage: envType === EnvironmentType.FullPage,
    isTypeOffscreen: envType === EnvironmentType.Offscreen,
    isTypeServiceWorker: envType === EnvironmentType.ServiceWorker,
    isTypeContentScript: envType === EnvironmentType.ContentScript,
    isTypeUnknown: envType === EnvironmentType.Unknown,
    isUI: isUI(envType),

    windowType,
    canAutoCloseThisWindow,
  };
};
