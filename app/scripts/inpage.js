// need to make sure we aren't affected by overlapping namespaces
// and that we dont affect the app with our namespace
// mostly a fix for web3's BigNumber if AMD's "define" is defined...
let __define;

/**
 * Caches reference to global define object and deletes it to
 * avoid conflicts with other global define objects, such as
 * AMD's define function
 */
const cleanContextForImports = () => {
  __define = global.define;
  try {
    global.define = undefined;
  } catch (_) {
    console.warn('MetaMask - global.define could not be deleted.');
  }
};

/**
 * Restores global define object from cached reference
 */
const restoreContextAfterImports = () => {
  try {
    global.define = __define;
  } catch (_) {
    console.warn('MetaMask - global.define could not be overwritten.');
  }
};

cleanContextForImports();

/* eslint-disable import/first */
import log from 'loglevel';
import { v4 as uuid } from 'uuid';
import { initializeProvider } from '@metamask/providers/dist/initializeInpageProvider';
import shouldInjectProvider from '../../shared/modules/provider-injection';
import PortStream from 'extension-port-stream';

// contexts
const EXTENSION_ID = 'nonfpcflonapegmnfeafnddgdniflbnk';

restoreContextAfterImports();

log.setDefaultLevel(process.env.METAMASK_DEBUG ? 'debug' : 'warn');


if (shouldInjectProvider()) {
  const extensionPort = chrome.runtime.connect(EXTENSION_ID);
  const connectionStream = new PortStream(extensionPort);

  initializeProvider({
    connectionStream,
    logger: log,
    shouldShimWeb3: true,
    providerInfo: {
      uuid: uuid(),
      name: process.env.METAMASK_BUILD_NAME,
      icon: process.env.METAMASK_BUILD_ICON,
      rdns: process.env.METAMASK_BUILD_APP_ID,
    },
  });
}
