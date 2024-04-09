import { WindowPostMessageStream } from '@metamask/post-message-stream';
import PortStream from 'extension-port-stream';
import ObjectMultiplex from 'obj-multiplex';
import pump from 'pump';
import { obj as createThoughStream } from 'through2';
import browser from 'webextension-polyfill';
import { EXTENSION_MESSAGES } from '../../shared/constants/app';
import { checkForLastError } from '../../shared/modules/browser-runtime.utils';
import { isManifestV3 } from '../../shared/modules/mv3.utils';
import shouldInjectProvider from '../../shared/modules/provider-injection';

// contexts
const CONTENT_SCRIPT = 'metamask-contentscript';
const INPAGE = 'metamask-inpage';
const PHISHING_WARNING_PAGE = 'metamask-phishing-warning-page';

// stream channels
const PHISHING_SAFELIST = 'metamask-phishing-safelist';
const PROVIDER = 'metamask-provider';

// For more information about these legacy streams, see here:
// https://github.com/MetaMask/metamask-extension/issues/15491
// TODO:LegacyProvider: Delete
const LEGACY_CONTENT_SCRIPT = 'contentscript';
const LEGACY_INPAGE = 'inpage';
const LEGACY_PROVIDER = 'provider';
const LEGACY_PUBLIC_CONFIG = 'publicConfig';

let legacyExtMux,
  legacyExtChannel,
  legacyExtPublicConfigChannel,
  legacyPageMux,
  legacyPageMuxLegacyProviderChannel,
  legacyPagePublicConfigChannel,
  notificationTransformStream;

const phishingPageUrl = new URL(process.env.PHISHING_WARNING_PAGE_URL);

let phishingExtChannel,
  phishingExtMux,
  phishingExtPort,
  phishingExtStream,
  phishingPageChannel,
  phishingPageMux;

let extensionMux,
  extensionChannel,
  extensionPort,
  extensionPhishingStream,
  extensionStream,
  pageMux,
  pageChannel;

/**
 * PHISHING STREAM LOGIC
 */

function setupPhishingPageStreams() {
  // the transport-specific streams for communication between inpage and background
  const phishingPageStream = new WindowPostMessageStream({
    name: CONTENT_SCRIPT,
    target: PHISHING_WARNING_PAGE,
  });

  // create and connect channel muxers
  // so we can handle the channels individually
  phishingPageMux = new ObjectMultiplex();
  phishingPageMux.setMaxListeners(25);

  pump(phishingPageMux, phishingPageStream, phishingPageMux, (err) =>
    logStreamDisconnectWarning('MetaMask Inpage Multiplex', err),
  );

  phishingPageChannel = phishingPageMux.createStream(PHISHING_SAFELIST);
}

const setupPhishingExtStreams = () => {
  phishingExtPort = browser.runtime.connect({
    name: CONTENT_SCRIPT,
  });
  phishingExtStream = new PortStream(phishingExtPort);

  // create and connect channel muxers
  // so we can handle the channels individually
  phishingExtMux = new ObjectMultiplex();
  phishingExtMux.setMaxListeners(25);

  pump(phishingExtMux, phishingExtStream, phishingExtMux, (err) => {
    logStreamDisconnectWarning('MetaMask Background Multiplex', err);
    window.postMessage(
      {
        target: PHISHING_WARNING_PAGE, // the post-message-stream "target"
        data: {
          // this object gets passed to obj-multiplex
          name: PHISHING_SAFELIST, // the obj-multiplex channel name
          data: {
            jsonrpc: '2.0',
            method: 'METAMASK_STREAM_FAILURE',
          },
        },
      },
      window.location.origin,
    );
  });

  // forward communication across inpage-background for these channels only
  phishingExtChannel = phishingExtMux.createStream(PHISHING_SAFELIST);
  pump(phishingPageChannel, phishingExtChannel, phishingPageChannel, (error) =>
    console.debug(
      `MetaMask: Muxed traffic for channel "${PHISHING_SAFELIST}" failed.`,
      error,
    ),
  );

  // eslint-disable-next-line no-use-before-define
  phishingExtPort.onDisconnect.addListener(onDisconnectDestroyPhishingStreams);
};

/** Destroys all of the phishing extension streams */
const destroyPhishingExtStreams = () => {
  phishingPageChannel.removeAllListeners();

  phishingExtMux.removeAllListeners();
  phishingExtMux.destroy();

  phishingExtChannel.removeAllListeners();
  phishingExtChannel.destroy();

  phishingExtStream = null;
};

/**
 * This listener destroys the phishing extension streams when the extension port is disconnected,
 * so that streams may be re-established later the phishing extension port is reconnected.
 */
const onDisconnectDestroyPhishingStreams = () => {
  const err = checkForLastError();

  phishingExtPort.onDisconnect.removeListener(
    onDisconnectDestroyPhishingStreams,
  );

  destroyPhishingExtStreams();

  /**
   * If an error is found, reset the streams. When running two or more dapps, resetting the service
   * worker may cause the error, "Error: Could not establish connection. Receiving end does not
   * exist.", due to a race-condition. The disconnect event may be called by runtime.connect which
   * may cause issues. We suspect that this is a chromium bug as this event should only be called
   * once the port and connections are ready. Delay time is arbitrary.
   */
  if (err) {
    console.warn(`${err} Resetting the phishing streams.`);
    setTimeout(setupPhishingExtStreams, 1000);
  }
};

/**
 * When the extension background is loaded it sends the EXTENSION_MESSAGES.READY message to the browser tabs.
 * This listener/callback receives the message to set up the streams after service worker in-activity.
 *
 * @param {object} msg
 * @param {string} msg.name - custom property and name to identify the message received
 * @returns {Promise|undefined}
 */
const onMessageSetUpPhishingStreams = (msg) => {
  if (msg.name === EXTENSION_MESSAGES.READY) {
    if (!phishingExtStream) {
      setupPhishingExtStreams();
    }
    return Promise.resolve(
      `MetaMask: handled "${EXTENSION_MESSAGES.READY}" for phishing streams`,
    );
  }
  return undefined;
};

/**
 * Initializes two-way communication streams between the browser extension and
 * the phishing page context. This function also creates an event listener to
 * reset the streams if the service worker resets.
 */
const initPhishingStreams = () => {
  setupPhishingPageStreams();
  setupPhishingExtStreams();

  browser.runtime.onMessage.addListener(onMessageSetUpPhishingStreams);
};

/**
 * INPAGE - EXTENSION STREAM LOGIC
 */

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

// The field below is used to ensure that replay is done only once for each restart.
let METAMASK_EXTENSION_CONNECT_SENT = false;

const setupExtensionStreams = () => {
  METAMASK_EXTENSION_CONNECT_SENT = true;
  extensionPort = browser.runtime.connect({ name: CONTENT_SCRIPT });
  extensionStream = new PortStream(extensionPort);
  extensionStream.on('data', extensionStreamMessageListener);

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

  // connect "phishing" channel to warning system
  extensionPhishingStream = extensionMux.createStream('phishing');
  extensionPhishingStream.once('data', redirectToPhishingWarning);

  // eslint-disable-next-line no-use-before-define
  extensionPort.onDisconnect.addListener(onDisconnectDestroyStreams);
};

/** Destroys all of the extension streams */
const destroyExtensionStreams = () => {
  pageChannel.removeAllListeners();

  extensionMux.removeAllListeners();
  extensionMux.destroy();

  extensionChannel.removeAllListeners();
  extensionChannel.destroy();

  extensionStream = null;
};

/**
 * LEGACY STREAM LOGIC
 * TODO:LegacyProvider: Delete
 */

// TODO:LegacyProvider: Delete
const setupLegacyPageStreams = () => {
  const legacyPageStream = new WindowPostMessageStream({
    name: LEGACY_CONTENT_SCRIPT,
    target: LEGACY_INPAGE,
  });

  legacyPageMux = new ObjectMultiplex();
  legacyPageMux.setMaxListeners(25);

  pump(legacyPageMux, legacyPageStream, legacyPageMux, (err) =>
    logStreamDisconnectWarning('MetaMask Legacy Inpage Multiplex', err),
  );

  legacyPageMuxLegacyProviderChannel =
    legacyPageMux.createStream(LEGACY_PROVIDER);
  legacyPagePublicConfigChannel =
    legacyPageMux.createStream(LEGACY_PUBLIC_CONFIG);
};

// TODO:LegacyProvider: Delete
const setupLegacyExtensionStreams = () => {
  legacyExtMux = new ObjectMultiplex();
  legacyExtMux.setMaxListeners(25);

  notificationTransformStream = getNotificationTransformStream();
  pump(
    legacyExtMux,
    extensionStream,
    notificationTransformStream,
    legacyExtMux,
    (err) => {
      logStreamDisconnectWarning('MetaMask Background Legacy Multiplex', err);
      notifyInpageOfStreamFailure();
    },
  );

  legacyExtChannel = legacyExtMux.createStream(PROVIDER);
  pump(
    legacyPageMuxLegacyProviderChannel,
    legacyExtChannel,
    legacyPageMuxLegacyProviderChannel,
    (error) =>
      console.debug(
        `MetaMask: Muxed traffic between channels "${LEGACY_PROVIDER}" and "${PROVIDER}" failed.`,
        error,
      ),
  );

  legacyExtPublicConfigChannel =
    legacyExtMux.createStream(LEGACY_PUBLIC_CONFIG);
  pump(
    legacyPagePublicConfigChannel,
    legacyExtPublicConfigChannel,
    legacyPagePublicConfigChannel,
    (error) =>
      console.debug(
        `MetaMask: Muxed traffic for channel "${LEGACY_PUBLIC_CONFIG}" failed.`,
        error,
      ),
  );
};

/**
 * Destroys all of the legacy extension streams
 * TODO:LegacyProvider: Delete
 */
const destroyLegacyExtensionStreams = () => {
  legacyPageMuxLegacyProviderChannel.removeAllListeners();
  legacyPagePublicConfigChannel.removeAllListeners();

  legacyExtMux.removeAllListeners();
  legacyExtMux.destroy();

  legacyExtChannel.removeAllListeners();
  legacyExtChannel.destroy();

  legacyExtPublicConfigChannel.removeAllListeners();
  legacyExtPublicConfigChannel.destroy();
};

/**
 * When the extension background is loaded it sends the EXTENSION_MESSAGES.READY message to the browser tabs.
 * This listener/callback receives the message to set up the streams after service worker in-activity.
 *
 * @param {object} msg
 * @param {string} msg.name - custom property and name to identify the message received
 * @returns {Promise|undefined}
 */
const onMessageSetUpExtensionStreams = (msg) => {
  if (msg.name === EXTENSION_MESSAGES.READY) {
    if (!extensionStream) {
      setupExtensionStreams();
      setupLegacyExtensionStreams();
    }
    return Promise.resolve(`MetaMask: handled ${EXTENSION_MESSAGES.READY}`);
  }
  return undefined;
};

/**
 * This listener destroys the extension streams when the extension port is disconnected,
 * so that streams may be re-established later when the extension port is reconnected.
 *
 * @param {Error} [err] - Stream connection error
 */
const onDisconnectDestroyStreams = (err) => {
  const lastErr = err || checkForLastError();

  extensionPort.onDisconnect.removeListener(onDisconnectDestroyStreams);

  destroyExtensionStreams();
  destroyLegacyExtensionStreams();

  /**
   * If an error is found, reset the streams. When running two or more dapps, resetting the service
   * worker may cause the error, "Error: Could not establish connection. Receiving end does not
   * exist.", due to a race-condition. The disconnect event may be called by runtime.connect which
   * may cause issues. We suspect that this is a chromium bug as this event should only be called
   * once the port and connections are ready. Delay time is arbitrary.
   */
  if (lastErr) {
    console.warn(`${lastErr} Resetting the streams.`);
    setTimeout(setupExtensionStreams, 1000);
  }
};

/**
 * Initializes two-way communication streams between the browser extension and
 * the local per-page browser context. This function also creates an event listener to
 * reset the streams if the service worker resets.
 */
const initStreams = () => {
  setupPageStreams();
  setupLegacyPageStreams();

  setupExtensionStreams();
  setupLegacyExtensionStreams();

  browser.runtime.onMessage.addListener(onMessageSetUpExtensionStreams);
};

// TODO:LegacyProvider: Delete
function getNotificationTransformStream() {
  return createThoughStream((chunk, _, cb) => {
    if (chunk?.name === PROVIDER) {
      if (chunk.data?.method === 'metamask_accountsChanged') {
        chunk.data.method = 'wallet_accountsChanged';
        chunk.data.result = chunk.data.params;
        delete chunk.data.params;
      }
    }
    cb(null, chunk);
  });
}

/**
 * Error handler for page to extension stream disconnections
 *
 * @param {string} remoteLabel - Remote stream name
 * @param {Error} error - Stream connection error
 */
function logStreamDisconnectWarning(remoteLabel, error) {
  console.debug(
    `MetaMask: Content script lost connection to "${remoteLabel}".`,
    error,
  );
}

/**
 * The function notifies inpage when the extension stream connection is ready. When the
 * 'metamask_chainChanged' method is received from the extension, it implies that the
 * background state is completely initialized and it is ready to process method calls.
 * This is used as a notification to replay any pending messages in MV3.
 *
 * @param {object} msg - instance of message received
 */
function extensionStreamMessageListener(msg) {
  if (
    METAMASK_EXTENSION_CONNECT_SENT &&
    isManifestV3 &&
    msg.data.method === 'metamask_chainChanged'
  ) {
    METAMASK_EXTENSION_CONNECT_SENT = false;
    window.postMessage(
      {
        target: INPAGE, // the post-message-stream "target"
        data: {
          // this object gets passed to obj-multiplex
          name: PROVIDER, // the obj-multiplex channel name
          data: {
            jsonrpc: '2.0',
            method: 'METAMASK_EXTENSION_CONNECT_CAN_RETRY',
          },
        },
      },
      window.location.origin,
    );
  }
}

/**
 * This function must ONLY be called in pump destruction/close callbacks.
 * Notifies the inpage context that streams have failed, via window.postMessage.
 * Relies on obj-multiplex and post-message-stream implementation details.
 */
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

/**
 * Redirects the current page to a phishing information page
 */
function redirectToPhishingWarning() {
  console.debug('MetaMask: Routing to Phishing Warning page.');
  const { hostname, href } = window.location;
  const baseUrl = process.env.PHISHING_WARNING_PAGE_URL;

  const querystring = new URLSearchParams({ hostname, href });
  window.location.href = `${baseUrl}#${querystring}`;
  // eslint-disable-next-line no-constant-condition
  while (1) {
    console.log(
      'MetaMask: Locking js execution, redirection will complete shortly',
    );
  }
}

const start = () => {
  const isDetectedPhishingSite =
    window.location.origin === phishingPageUrl.origin &&
    window.location.pathname === phishingPageUrl.pathname;

  if (isDetectedPhishingSite) {
    initPhishingStreams();
    return;
  }

  if (shouldInjectProvider()) {
    initStreams();

    // https://bugs.chromium.org/p/chromium/issues/detail?id=1457040
    // Temporary workaround for chromium bug that breaks the content script <=> background connection
    // for prerendered pages. This resets potentially broken extension streams if a page transitions
    // from the prerendered state to the active state.
    if (document.prerendering) {
      document.addEventListener('prerenderingchange', () => {
        onDisconnectDestroyStreams(
          new Error('Prerendered page has become active.'),
        );
      });
    }
  }
};

start();
