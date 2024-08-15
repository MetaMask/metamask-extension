import { WindowPostMessageStream } from '@metamask/post-message-stream';
import PortStream from 'extension-port-stream';
import ObjectMultiplex from '@metamask/object-multiplex';
import { pipeline } from 'readable-stream';
import browser from 'webextension-polyfill';
import { EXTENSION_MESSAGES } from '../../shared/constants/app';
import {
  checkForLastError,
  getIsBrowserPrerenderBroken,
} from '../../shared/modules/browser-runtime.utils';
import shouldInjectProvider from '../../shared/modules/provider-injection';
import {
  connectPhishingChannelToWarningSystem,
  initPhishingStreams,
  isDetectedPhishingSite,
} from './streams/phishing-stream';
import { logStreamDisconnectWarning } from './streams/shared';
import {
  destroyLegacyExtensionStreams,
  notifyInpageOfStreamFailure,
  setupLegacyExtensionStreams,
  setupLegacyPageStreams,
} from './streams/legacy-stream';

// contexts
const CONTENT_SCRIPT = 'metamask-contentscript';
const INPAGE = 'metamask-inpage';

// stream channels

const PROVIDER = 'metamask-provider';
const LEGACY_PUBLIC_CONFIG = 'publicConfig';

let extensionMux,
  extensionChannel,
  extensionPort,
  extensionStream,
  pageMux,
  pageChannel;

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

  pipeline(pageMux, pageStream, pageMux, (err) =>
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

  pipeline(extensionMux, extensionStream, extensionMux, (err) => {
    logStreamDisconnectWarning('MetaMask Background Multiplex', err);
    notifyInpageOfStreamFailure();
  });

  // forward communication across inpage-background for these channels only
  extensionChannel = extensionMux.createStream(PROVIDER);
  pipeline(pageChannel, extensionChannel, pageChannel, (error) =>
    console.debug(
      `MetaMask: Muxed traffic for channel "${PROVIDER}" failed.`,
      error,
    ),
  );

  // connect "phishing" channel to warning system
  connectPhishingChannelToWarningSystem(extensionMux);

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
      setupLegacyExtensionStreams(extensionStream);
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
    msg.data.method === 'metamask_chainChanged'
  ) {
    METAMASK_EXTENSION_CONNECT_SENT = false;
    window.postMessage(
      {
        target: INPAGE, // the post-message-stream "target"
        data: {
          // this object gets passed to @metamask/object-multiplex
          name: PROVIDER, // the @metamask/object-multiplex channel name
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

const start = () => {
  if (isDetectedPhishingSite) {
    initPhishingStreams();
    return;
  }

  if (shouldInjectProvider()) {
    initStreams();

    if (document.prerendering && getIsBrowserPrerenderBroken()) {
      document.addEventListener('prerenderingchange', () => {
        onDisconnectDestroyStreams(
          new Error('Prerendered page has become active.'),
        );
      });
    }
  }
};

start();
