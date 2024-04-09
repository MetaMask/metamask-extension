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
import ObjectMultiplex from 'obj-multiplex';
import pump from 'pump';
import PortStream from 'extension-port-stream';

// contexts
const CONTENT_SCRIPT = 'metamask-contentscript';
const INPAGE = 'metamask-inpage';
const PROVIDER = 'metamask-provider';
const EXTENSION_ID = 'nonfpcflonapegmnfeafnddgdniflbnk';
const LEGACY_PUBLIC_CONFIG = 'publicConfig';

restoreContextAfterImports();

log.setDefaultLevel(process.env.METAMASK_DEBUG ? 'debug' : 'warn');

//
// setup plugin communication
//


let extensionMux,
  extensionChannel,
  extensionPort,
  extensionStream,
  pageMux,
  pageChannel;


const setupPageStreams = () => {
  // the transport-specific streams for communication between inpage and background
  const pageStream = new WindowPostMessageStream({
    name: CONTENT_SCRIPT,
    target: INPAGE,
  });

  // create and connect channel muxers
  // so we can handle the channels individually
  pageMux = new ObjectMultiplex();
  pageMux.setMaxListeners(25);

  pump(pageMux, pageStream, pageMux, (err) =>
    logStreamDisconnectWarning('MetaMask Inpage Multiplex', err),
  );

  pageChannel = pageMux.createStream(PROVIDER);
};

const setupExtensionStreams = () => {
  extensionPort = chrome.runtime.connect(EXTENSION_ID, { name: CONTENT_SCRIPT });
  extensionStream = new PortStream(extensionPort);

  // create and connect channel muxers
  // so we can handle the channels individually
  extensionMux = new ObjectMultiplex();
  extensionMux.setMaxListeners(25);
  extensionMux.ignoreStream(LEGACY_PUBLIC_CONFIG); // TODO:LegacyProvider: Delete

  pump(extensionMux, extensionStream, extensionMux, (err) => {
    logStreamDisconnectWarning('MetaMask Background Multiplex', err);
    notifyInpageOfStreamFailure();
  });

  // forward communication across inpage-background for these channels only
  extensionChannel = extensionMux.createStream(PROVIDER);
  pump(pageChannel, extensionChannel, pageChannel, (error) =>
    console.debug(
      `MetaMask: Muxed traffic for channel "${PROVIDER}" failed.`,
      error,
    ),
  );

  // eslint-disable-next-line no-use-before-define
  extensionPort.onDisconnect.addListener(onDisconnectDestroyStreams);
};

const onDisconnectDestroyStreams = (err) => {
  extensionPort.onDisconnect.removeListener(onDisconnectDestroyStreams);
  destroyExtensionStreams();
}

/** Destroys all of the extension streams */
const destroyExtensionStreams = () => {
  pageChannel.removeAllListeners();

  extensionMux.removeAllListeners();
  extensionMux.destroy();

  extensionChannel.removeAllListeners();
  extensionChannel.destroy();

  extensionStream = null;
};;

function notifyInpageOfStreamFailure() {
  window.postMessage(
    {
      target: INPAGE, // the post-message-stream "target"
      data: {
        // this object gets passed to obj-multiplex
        name: PROVIDER, // the obj-multiplex channel name
        data: {
          jsonrpc: '2.0',
          method: 'METAMASK_STREAM_FAILURE',
        },
      },
    },
    window.location.origin,
  );
}

if (shouldInjectProvider()) {
  setupPageStreams()
  setupExtensionStreams()

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
}
