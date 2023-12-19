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
import { WindowPostMessageStream } from '@metamask/post-message-stream';
import { initializeProvider } from '@metamask/providers/dist/initializeInpageProvider';
import shouldInjectProvider from '../../shared/modules/provider-injection';

// contexts
const CONTENT_SCRIPT = 'metamask-contentscript';
const INPAGE = 'metamask-inpage';
const PROVIDER = 'metamask-provider';

restoreContextAfterImports();

log.setDefaultLevel(process.env.METAMASK_DEBUG ? 'debug' : 'warn');

//
// setup plugin communication
//

if (shouldInjectProvider()) {
  // setup background connection
  const metamaskStream = new WindowPostMessageStream({
    name: INPAGE,
    target: CONTENT_SCRIPT,
  });

  initializeProvider({
    connectionStream: metamaskStream,
    logger: log,
    shouldShimWeb3: true,
    providerInfo: {
      uuid: uuid(),
      name: process.env.METAMASK_BUILD_NAME,
      icon: process.env.METAMASK_BUILD_ICON,
      rdns: process.env.METAMASK_BUILD_APP_ID,
    },
  });

  setTimeout(() => {
    console.log('posted fake CONNECTION_CLOSING from inpage')
    window.postMessage(
      {
        target: CONTENT_SCRIPT, // the post-message-stream "target"
        data: {
          // this object gets passed to obj-multiplex
          name: PROVIDER, // the obj-multiplex channel name
          data: {
            jsonrpc: '2.0',
            method: 'CONNECTION_CLOSING',
          },
        },
      },
      window.location.origin,
    );
  }, 5000)

  window.addEventListener('pagehide', (event) => {
    if (event.persisted) {
      console.log("Page being persisted")
      return
    }
    console.log('Page has become hidden', event)
    // window.postMessage(
    //   {
    //     target: CONTENT_SCRIPT, // the post-message-stream "target"
    //     data: {
    //       // this object gets passed to obj-multiplex
    //       name: PROVIDER, // the obj-multiplex channel name
    //       data: {
    //         jsonrpc: '2.0',
    //         method: 'CONNECTION_CLOSING',
    //       },
    //     },
    //   },
    //   window.location.origin,
    // );
  });
}
