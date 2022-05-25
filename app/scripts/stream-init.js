/**
 * @file The entry point for the web extension singleton process.
 */

import log from 'loglevel';
import browser from 'webextension-polyfill';

import { isManifestV3 } from '../../shared/modules/mv3.utils';

/**
 * Constants used are included here to avoid importing large files
 */
const ENVIRONMENT_TYPE_POPUP = 'popup';
const ENVIRONMENT_TYPE_NOTIFICATION = 'notification';
const ENVIRONMENT_TYPE_FULLSCREEN = 'fullscreen';
const PLATFORM_BRAVE = 'Brave';
const PLATFORM_CHROME = 'Chrome';
const PLATFORM_EDGE = 'Edge';
const PLATFORM_FIREFOX = 'Firefox';
const PLATFORM_OPERA = 'Opera';

/**
 * Returns the platform (browser) where the extension is running.
 *
 * @returns {string} the platform ENUM
 */
const getPlatform = () => {
  const { navigator } = window;
  const { userAgent } = navigator;

  if (userAgent.includes('Firefox')) {
    return PLATFORM_FIREFOX;
  } else if ('brave' in navigator) {
    return PLATFORM_BRAVE;
  } else if (userAgent.includes('Edg/')) {
    return PLATFORM_EDGE;
  } else if (userAgent.includes('OPR')) {
    return PLATFORM_OPERA;
  }
  return PLATFORM_CHROME;
};

const metamaskInternalProcessHash = {
  [ENVIRONMENT_TYPE_POPUP]: true,
  [ENVIRONMENT_TYPE_NOTIFICATION]: true,
  [ENVIRONMENT_TYPE_FULLSCREEN]: true,
};

const metamaskBlockedPorts = ['trezor-connect'];

browser.runtime.onConnect.addListener(initialize);

/**
 * Initializes the MetaMask controller, and sets up all platform configuration.
 *
 * @param {string} remoteSourcePort - remote application port connecting to extension.
 * @returns {Promise} Setup complete.
 */
async function initialize(remoteSourcePort) {
  if (isManifestV3() && remoteSourcePort) {
    connectRemote(remoteSourcePort);
  }

  browser.runtime.onConnect.addListener(connectRemote);

  /**
   * A runtime.Port object, as provided by the browser:
   *
   * @see https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/runtime/Port
   * @typedef Port
   * @type Object
   */
  function connectRemote(remotePort) {
    const processName = remotePort.name;

    if (metamaskBlockedPorts.includes(remotePort.name)) {
      return;
    }

    let isMetaMaskInternalProcess = false;
    const sourcePlatform = getPlatform();

    if (sourcePlatform === PLATFORM_FIREFOX) {
      isMetaMaskInternalProcess = metamaskInternalProcessHash[processName];
    } else {
      isMetaMaskInternalProcess =
        remotePort.sender.origin === `chrome-extension://${browser.runtime.id}`;
    }

    if (isMetaMaskInternalProcess) {
      if (isManifestV3()) {
        console.log('----- SENDING CON READY -----');
        // Message below if captured by UI code in app/scripts/ui.js which will trigger UI initialisation
        // This ensures that UI is initialised only after background is ready
        // It fixes the issue of blank screen coming when extension is loaded, the issue is very frequent in MV3
        remotePort.postMessage({ name: 'CONNECTION_READY' });
      }
    }
  }
  log.info('Stream initialization complete.');
}
