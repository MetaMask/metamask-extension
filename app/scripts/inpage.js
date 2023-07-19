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
import 'ses'; // import ses to get agoric assert and lockdown global

try {
  // eslint-disable-next-line no-undef,import/unambiguous
  lockdown({
    consoleTaming: 'unsafe',
    errorTaming: 'unsafe',
    mathTaming: 'unsafe',
    dateTaming: 'unsafe',
    domainTaming: 'unsafe',
    overrideTaming: 'severe',
  });
} catch (error) {
  console.error('Lockdown failed:', error);
}
import '@endo/eventual-send/shim'; // install `HandledPromise` shim
import log from 'loglevel';
import pump from 'pump';
import { WindowPostMessageStream } from '@metamask/post-message-stream';
import { initializeProvider } from '@metamask/providers/dist/initializeInpageProvider';
import shouldInjectProvider from '../../shared/modules/provider-injection';
import makeCapTpFromStream from './lib/makeCapTpFromStream';

// contexts
const CONTENT_SCRIPT = 'metamask-contentscript';
const INPAGE = 'metamask-inpage';

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

  const { captpStream, abort } = makeCapTpFromStream(
    window.location.origin,
    harden({
      greet: async (name) => {
        // eslint-disable-next-line no-alert, no-undef
        alert(`Hello, ${name}!`);
      },
    }),
  );
  pump(captpStream, metamaskStream, captpStream, (err) => {
    log.error(err);
    abort();
  });

  initializeProvider({
    connectionStream: metamaskStream,
    logger: log,
    shouldShimWeb3: true,
  });
}
