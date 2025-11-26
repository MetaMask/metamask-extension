/*
 * MetaMask Provider Streams
 *
 * Establishes and maintains multiplexed communication between the extension background
 * (service worker) and each page (inpage provider). Handles:
 * - Transport setup via WindowPostMessageStream and ExtensionPortStream
 * - Channel separation using ObjectMultiplex
 * - Graceful shutdown to prevent ERR_STREAM_PREMATURE_CLOSE on page navigation
 * - Resilient reconnection with exponential backoff and single-flight guards
 * - Legacy provider bridging (to be removed)
 */
import ObjectMultiplex from '@metamask/object-multiplex';
import { Substream } from '@metamask/object-multiplex/dist/Substream';
import { WindowPostMessageStream } from '@metamask/post-message-stream';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error types/readable-stream.d.ts does not get picked up by ts-node
import { pipeline, Transform } from 'readable-stream';
import browser from 'webextension-polyfill';
import { ExtensionPortStream } from 'extension-port-stream';
import {
  CONTENT_SCRIPT,
  LEGACY_CONTENT_SCRIPT,
  LEGACY_INPAGE,
  LEGACY_PROVIDER,
  LEGACY_PUBLIC_CONFIG,
  METAMASK_CAIP_MULTICHAIN_PROVIDER,
  METAMASK_COOKIE_HANDLER,
  METAMASK_INPAGE,
  METAMASK_EIP_1193_PROVIDER,
  PHISHING_SAFELIST,
  PHISHING_STREAM,
} from '../constants/stream';
import { EXTENSION_MESSAGES } from '../../../shared/constants/messages';
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
  extensionEip1193Channel: Substream,
  extensionCaipChannel: Substream,
  extensionPort: browser.Runtime.Port | null,
  extensionStream: ExtensionPortStream | null,
  pageMux: ObjectMultiplex,
  pageChannel: Substream,
  caipChannel: Substream;

/**
 * Sets up per-page streams and mux, connecting the in page transport to channels used
 * by EIP-1193 and CAIP providers. Adds proactive mux termination on transport end/close
 * to suppress premature close errors on navigation.
 */
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

  /**
   * Graceful shutdown handler for the page mux.
   *
   * WHY THIS IS NEEDED (unlike in inpage.js):
   *
   * EXTENSION CONTEXT vs PAGE CONTEXT:
   * This code runs in the EXTENSION's content script context (persistent), unlike
   * inpage.js which runs in PAGE context (destroyed on navigation). The extension
   * context persists even when pages navigate/close.
   *
   * PREVENTS "PREMATURE CLOSE" ERRORS:
   * When the underlying transport (pageStream) terminates, the mux needs to
   * gracefully end before the pipeline detects the closure. Without this handler,
   * the pipeline sees an abrupt stream closure and throws "ERR_STREAM_PREMATURE_CLOSE".
   *
   * TIMING MATTERS:
   * By listening to 'close' and 'end' events on the transport, we can end the mux
   * proactively, before the pipeline's error detection kicks in, preventing the error
   * from propagating through the stream chain.
   *
   * HIGH IMPACT:
   * These "Premature close" errors are the #1 error in Sentry (3.8M/month). They occur
   * during normal operations: page navigation, tab closure, etc. Graceful shutdown
   * significantly reduces error noise in production.
   *
   * For context, see:
   * - https://github.com/MetaMask/metamask-extension/issues/26337
   * - https://github.com/MetaMask/metamask-extension/issues/35241
   * - Similar approach in caip-stream.ts from PR #33470
   */
  const endPageMuxIfOpen = () => {
    if (!pageMux.destroyed && !pageMux.writableEnded) {
      pageMux.end();
    }
  };

  // Attach handlers to detect when the underlying transport terminates
  pageStream.once?.('close', endPageMuxIfOpen);
  pageStream.once?.('end', endPageMuxIfOpen);

  pipeline(pageMux, pageStream, pageMux, (err: Error) =>
    logStreamDisconnectWarning('MetaMask Inpage Multiplex', err),
  );

  pageChannel = pageMux.createStream(METAMASK_EIP_1193_PROVIDER);
  caipChannel = pageMux.createStream(METAMASK_CAIP_MULTICHAIN_PROVIDER);

  pageMux.ignoreStream(METAMASK_COOKIE_HANDLER);
  pageMux.ignoreStream(LEGACY_PROVIDER);
  pageMux.ignoreStream(LEGACY_PUBLIC_CONFIG);
  pageMux.ignoreStream(PHISHING_SAFELIST);
  pageMux.ignoreStream(PHISHING_STREAM);
};

// The field below is used to ensure that replay is done only once for each restart.
let METAMASK_EXTENSION_CONNECT_SENT = false;

/**
 * Initializes extension-side streams and mux, wiring channels to the page mux.
 * Also registers disconnect handling and notifies in page of failures. Resets
 * reconnect attempt counters on successful setup.
 */
export const setupExtensionStreams = () => {
  METAMASK_EXTENSION_CONNECT_SENT = true;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer as unknown as number);
    reconnectTimer = null;
  }
  extensionPort = browser.runtime.connect({ name: CONTENT_SCRIPT });
  extensionStream = new ExtensionPortStream(extensionPort, { chunkSize: 0 });
  extensionStream.on('data', extensionStreamMessageListener);

  // create and connect channel multiplexers
  // so we can handle the channels individually
  extensionMux = new ObjectMultiplex();
  extensionMux.setMaxListeners(25);
  extensionMux.ignoreStream(LEGACY_PUBLIC_CONFIG); // TODO:LegacyProvider: Delete

  /**
   * Graceful shutdown handler for the extension mux.
   * See the comment above the page mux handler for detailed explanation of why
   * these handlers are necessary in extension context but not in page context.
   */
  const endExtensionMuxIfOpen = () => {
    if (!extensionMux.destroyed && !extensionMux.writableEnded) {
      extensionMux.end();
    }
  };

  // Attach handlers to detect when the underlying transport terminates
  extensionStream?.once?.('close', endExtensionMuxIfOpen);
  extensionStream?.once?.('end', endExtensionMuxIfOpen);

  pipeline(extensionMux, extensionStream, extensionMux, (err: Error) => {
    logStreamDisconnectWarning('MetaMask Background Multiplex', err);
    notifyInpageOfStreamFailure();
  });

  // forward communication across inpage-background for these channels only
  extensionEip1193Channel = extensionMux.createStream(
    METAMASK_EIP_1193_PROVIDER,
  );
  pipeline(pageChannel, extensionEip1193Channel, pageChannel, (error: Error) =>
    console.debug(
      `MetaMask: Muxed traffic for channel "${METAMASK_EIP_1193_PROVIDER}" failed.`,
      error,
    ),
  );

  extensionCaipChannel = extensionMux.createStream(
    METAMASK_CAIP_MULTICHAIN_PROVIDER,
  );
  pipeline(caipChannel, extensionCaipChannel, caipChannel, (error: Error) =>
    console.debug(
      `MetaMask: Muxed traffic for channel "${METAMASK_CAIP_MULTICHAIN_PROVIDER}" failed.`,
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

  extensionEip1193Channel.removeAllListeners();
  extensionEip1193Channel.destroy();

  extensionCaipChannel.removeAllListeners();
  extensionCaipChannel.destroy();

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
  legacyPageMux.ignoreStream(METAMASK_EIP_1193_PROVIDER);
  legacyPageMux.ignoreStream(METAMASK_CAIP_MULTICHAIN_PROVIDER);
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

  legacyExtChannel = legacyExtMux.createStream(METAMASK_EIP_1193_PROVIDER);
  pipeline(
    legacyPageMuxLegacyProviderChannel,
    legacyExtChannel,
    legacyPageMuxLegacyProviderChannel,
    (error: Error) =>
      console.debug(
        `MetaMask: Muxed traffic between channels "${LEGACY_PROVIDER}" and "${METAMASK_EIP_1193_PROVIDER}" failed.`,
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
  legacyExtMux.ignoreStream(METAMASK_CAIP_MULTICHAIN_PROVIDER);
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
    reconnectAttempts = 0;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer as unknown as number);
      reconnectTimer = null;
    }
    return Promise.resolve(`MetaMask: handled ${EXTENSION_MESSAGES.READY}`);
  }
  return undefined;
};

/**
 * Ends two-way communication streams between browser extension and
 * the local per-page browser context.
 */
/**
 * Tears down all streams/muxes and disconnects the runtime port. Ensures any
 * pending reconnect timer is cleared and counters reset to avoid reconnect storms.
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
  if (reconnectTimer) {
    clearTimeout(reconnectTimer as unknown as number);
    reconnectTimer = null;
  }
  reconnectAttempts = 0;
}

const BASE_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 30000;
let reconnectAttempts = 0;
let reconnectTimer: number | null = null;
/**
 * Schedules a reconnect using exponential backoff with jitter and single-flight guard:
 * - Delay = min(base * 2^attempts, MAX) + random(0, 20% of delay)
 * - Only one timer can be active; subsequent calls are ignored until it fires
 * - Attempts are capped to avoid unbounded growth
 */
function scheduleExtensionReconnect() {
  if (reconnectTimer) {
    return;
  }
  const base = Math.min(BASE_RECONNECT_DELAY_MS * 2 ** reconnectAttempts, MAX_RECONNECT_DELAY_MS);
  const jitter = Math.floor(Math.random() * base * 0.2);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    setupExtensionStreams();
    reconnectAttempts = Math.min(reconnectAttempts + 1, 30);
  }, base + jitter) as unknown as number;
}

/**
 * This listener destroys the extension streams when the extension port is disconnected,
 * so that streams may be re-established later when the extension port is reconnected.
 *
 * @param [err] - Stream connection error
 */
/**
 * Disconnect handler: destroys current streams and, if an error was detected,
 * triggers a guarded backoff reconnect. Addresses Chromium race conditions where
 * ports disconnect before connections are fully established.
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
    scheduleExtensionReconnect();
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
      if (
        chunk?.name === METAMASK_EIP_1193_PROVIDER &&
        chunk.data?.method === 'metamask_accountsChanged'
      ) {
        chunk.data.method = 'wallet_accountsChanged';
        chunk.data.result = chunk.data.params;
        delete chunk.data.params;
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
/**
 * Listens for 'metamask_chainChanged' from background to signal readiness
 * and allows inpage to replay queued messages in MV3 environments.
 */
function extensionStreamMessageListener(msg: MessageType) {
  if (
    METAMASK_EXTENSION_CONNECT_SENT &&
    msg.data.method === 'metamask_chainChanged'
  ) {
    METAMASK_EXTENSION_CONNECT_SENT = false;
    reconnectAttempts = 0;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer as unknown as number);
      reconnectTimer = null;
    }
    window.postMessage(
      {
        target: METAMASK_INPAGE, // the post-message-stream "target"
        data: {
          // this object gets passed to @metamask/object-multiplex
          name: METAMASK_EIP_1193_PROVIDER, // the @metamask/object-multiplex channel name
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
/**
 * Notifies inpage context that streams have failed via window.postMessage.
 * Must only be called from pipeline destruction/close callbacks.
 */
function notifyInpageOfStreamFailure() {
  window.postMessage(
    {
      target: METAMASK_INPAGE, // the post-message-stream "target"
      data: {
        // this object gets passed to @metamask/object-multiplex
        name: METAMASK_EIP_1193_PROVIDER, // the @metamask/object-multiplex channel name
        data: {
          jsonrpc: '2.0',
          method: 'METAMASK_STREAM_FAILURE',
        },
      },
    },
    window.location.origin,
  );
}
