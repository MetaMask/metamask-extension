import ObjectMultiplex from '@metamask/object-multiplex';
import { Substream } from '@metamask/object-multiplex/dist/Substream';
import { WindowPostMessageStream } from '@metamask/post-message-stream';
import PortStream from 'extension-port-stream';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error types/readable-stream.d.ts does not get picked up by ts-node
import { pipeline, Transform } from 'readable-stream';
import browser from 'webextension-polyfill';
import {
  CONTENT_SCRIPT,
  LEGACY_CONTENT_SCRIPT,
  LEGACY_INPAGE,
  LEGACY_PROVIDER,
  LEGACY_PUBLIC_CONFIG,
  METAMASK_COOKIE_HANDLER,
  METAMASK_INPAGE,
  METAMASK_PROVIDER,
  PHISHING_SAFELIST,
  PHISHING_STREAM,
} from '../constants/stream';
import { EXTENSION_MESSAGES } from '../../../shared/constants/app';
import { checkForLastError } from '../../../shared/modules/browser-runtime.utils';
import { logStreamDisconnectWarning, MessageType } from './stream-utils';
import { connectPhishingChannelToWarningSystem } from './phishing-stream';

let legacyExtMux: ObjectMultiplex,
  legacyExtChannel: Substream,
  legacyExtPublicConfigChannel: Substream,
  legacyPageMux: ObjectMultiplex,
  legacyPageMuxLegacyProviderChannel: Substream,
  legacyPagePublicConfigChannel: Substream,
  notificationTransformStream: Transform;

let extensionMux: ObjectMultiplex,
  extensionChannel: Substream,
  extensionPort: browser.Runtime.Port | null,
  extensionStream: PortStream | null,
  pageMux: ObjectMultiplex,
  pageChannel: Substream;

const setupPageStreams = () => {
  // the transport-specific streams for communication between inpage and background
  const pageStream = new WindowPostMessageStream({
    name: CONTENT_SCRIPT,
    target: METAMASK_INPAGE,
  });

  // create and connect channel muxers
  // so we can handle the channels individually
  pageMux = new ObjectMultiplex();
  pageMux.setMaxListeners(25);

  pipeline(pageMux, pageStream, pageMux, (err: Error) =>
    logStreamDisconnectWarning('MetaMask Inpage Multiplex', err),
  );

  pageChannel = pageMux.createStream(METAMASK_PROVIDER);
  pageMux.ignoreStream(METAMASK_COOKIE_HANDLER);
  pageMux.ignoreStream(LEGACY_PROVIDER);
  pageMux.ignoreStream(LEGACY_PUBLIC_CONFIG);
  pageMux.ignoreStream(PHISHING_SAFELIST);
  pageMux.ignoreStream(PHISHING_STREAM);
};

// The field below is used to ensure that replay is done only once for each restart.
let METAMASK_EXTENSION_CONNECT_SENT = false;

export const setupExtensionStreams = () => {
  METAMASK_EXTENSION_CONNECT_SENT = true;
  extensionPort = browser.runtime.connect({ name: CONTENT_SCRIPT });
  extensionStream = new PortStream(extensionPort);
  extensionStream.on('data', extensionStreamMessageListener);

  // create and connect channel muxers
  // so we can handle the channels individually
  extensionMux = new ObjectMultiplex();
  extensionMux.setMaxListeners(25);
  extensionMux.ignoreStream(LEGACY_PUBLIC_CONFIG); // TODO:LegacyProvider: Delete

  pipeline(extensionMux, extensionStream, extensionMux, (err: Error) => {
    logStreamDisconnectWarning('MetaMask Background Multiplex', err);
    notifyInpageOfStreamFailure();
  });

  // forward communication across inpage-background for these channels only
  extensionChannel = extensionMux.createStream(METAMASK_PROVIDER);
  pipeline(pageChannel, extensionChannel, pageChannel, (error: Error) =>
    console.debug(
      `MetaMask: Muxed traffic for channel "${METAMASK_PROVIDER}" failed.`,
      error,
    ),
  );

  // connect "phishing" channel to warning system
  connectPhishingChannelToWarningSystem(extensionMux);

  // eslint-disable-next-line no-use-before-define
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
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

  pipeline(legacyPageMux, legacyPageStream, legacyPageMux, (err: Error) =>
    logStreamDisconnectWarning('MetaMask Legacy Inpage Multiplex', err),
  );

  legacyPageMuxLegacyProviderChannel =
    legacyPageMux.createStream(LEGACY_PROVIDER);
  legacyPagePublicConfigChannel =
    legacyPageMux.createStream(LEGACY_PUBLIC_CONFIG);

  legacyPageMux.ignoreStream(METAMASK_COOKIE_HANDLER);
  legacyPageMux.ignoreStream(METAMASK_PROVIDER);
  legacyPageMux.ignoreStream(PHISHING_SAFELIST);
  legacyPageMux.ignoreStream(PHISHING_STREAM);
};

// TODO:LegacyProvider: Delete
const setupLegacyExtensionStreams = () => {
  legacyExtMux = new ObjectMultiplex();
  legacyExtMux.setMaxListeners(25);

  notificationTransformStream = getNotificationTransformStream();
  pipeline(
    legacyExtMux,
    extensionStream,
    notificationTransformStream,
    legacyExtMux,
    (err: Error) => {
      logStreamDisconnectWarning('MetaMask Background Legacy Multiplex', err);
      notifyInpageOfStreamFailure();
    },
  );

  legacyExtChannel = legacyExtMux.createStream(METAMASK_PROVIDER);
  pipeline(
    legacyPageMuxLegacyProviderChannel,
    legacyExtChannel,
    legacyPageMuxLegacyProviderChannel,
    (error: Error) =>
      console.debug(
        `MetaMask: Muxed traffic between channels "${LEGACY_PROVIDER}" and "${METAMASK_PROVIDER}" failed.`,
        error,
      ),
  );

  legacyExtPublicConfigChannel =
    legacyExtMux.createStream(LEGACY_PUBLIC_CONFIG);
  pipeline(
    legacyPagePublicConfigChannel,
    legacyExtPublicConfigChannel,
    legacyPagePublicConfigChannel,
    (error: Error) =>
      console.debug(
        `MetaMask: Muxed traffic for channel "${LEGACY_PUBLIC_CONFIG}" failed.`,
        error,
      ),
  );
  legacyExtMux.ignoreStream(METAMASK_COOKIE_HANDLER);
  legacyExtMux.ignoreStream(LEGACY_PROVIDER);
  legacyExtMux.ignoreStream(PHISHING_SAFELIST);
  legacyExtMux.ignoreStream(PHISHING_STREAM);
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
 * @param msg
 * @param msg.name - custom property and name to identify the message received
 * @returns
 */
const onMessageSetUpExtensionStreams = (msg: MessageType) => {
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
 * Ends two-way communication streams between browser extension and
 * the local per-page browser context.
 */
export function destroyStreams() {
  if (!extensionPort) {
    return;
  }
  extensionPort.onDisconnect.removeListener(onDisconnectDestroyStreams);

  destroyExtensionStreams();
  destroyLegacyExtensionStreams();

  extensionPort.disconnect();
  extensionPort = null;

  METAMASK_EXTENSION_CONNECT_SENT = false;
}

/**
 * This listener destroys the extension streams when the extension port is disconnected,
 * so that streams may be re-established later when the extension port is reconnected.
 *
 * @param [err] - Stream connection error
 */
export function onDisconnectDestroyStreams(err: unknown) {
  const lastErr = err || checkForLastError();

  destroyStreams();

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
}

/**
 * Initializes two-way communication streams between the browser extension and
 * the local per-page browser context. This function also creates an event listener to
 * reset the streams if the service worker resets.
 */
export const initStreams = () => {
  setupPageStreams();
  setupLegacyPageStreams();

  setupExtensionStreams();
  setupLegacyExtensionStreams();

  browser.runtime.onMessage.addListener(onMessageSetUpExtensionStreams);
};

// TODO:LegacyProvider: Delete
function getNotificationTransformStream() {
  const stream = new Transform({
    highWaterMark: 16,
    objectMode: true,
    transform: (chunk, _, cb) => {
      if (chunk?.name === METAMASK_PROVIDER) {
        if (chunk.data?.method === 'metamask_accountsChanged') {
          chunk.data.method = 'wallet_accountsChanged';
          chunk.data.result = chunk.data.params;
          delete chunk.data.params;
        }
      }
      cb(null, chunk);
    },
  });
  return stream;
}

/**
 * The function notifies inpage when the extension stream connection is ready. When the
 * 'metamask_chainChanged' method is received from the extension, it implies that the
 * background state is completely initialized and it is ready to process method calls.
 * This is used as a notification to replay any pending messages in MV3.
 *
 * @param msg - instance of message received
 */
function extensionStreamMessageListener(msg: MessageType) {
  if (
    METAMASK_EXTENSION_CONNECT_SENT &&
    msg.data.method === 'metamask_chainChanged'
  ) {
    METAMASK_EXTENSION_CONNECT_SENT = false;
    window.postMessage(
      {
        target: METAMASK_INPAGE, // the post-message-stream "target"
        data: {
          // this object gets passed to @metamask/object-multiplex
          name: METAMASK_PROVIDER, // the @metamask/object-multiplex channel name
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
 * This function must ONLY be called in pipeline destruction/close callbacks.
 * Notifies the inpage context that streams have failed, via window.postMessage.
 * Relies on @metamask/object-multiplex and post-message-stream implementation details.
 */
function notifyInpageOfStreamFailure() {
  window.postMessage(
    {
      target: METAMASK_INPAGE, // the post-message-stream "target"
      data: {
        // this object gets passed to @metamask/object-multiplex
        name: METAMASK_PROVIDER, // the @metamask/object-multiplex channel name
        data: {
          jsonrpc: '2.0',
          method: 'METAMASK_STREAM_FAILURE',
        },
      },
    },
    window.location.origin,
  );
}
