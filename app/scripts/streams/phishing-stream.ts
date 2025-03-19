import { WindowPostMessageStream } from '@metamask/post-message-stream';
import ObjectMultiplex from '@metamask/object-multiplex';
import { Substream } from '@metamask/object-multiplex/dist/Substream';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error types/readable-stream.d.ts does not get picked up by ts-node
import { pipeline } from 'readable-stream';
import browser from 'webextension-polyfill';
import PortStream from 'extension-port-stream';
import { checkForLastError } from '../../../shared/modules/browser-runtime.utils';
import { EXTENSION_MESSAGES } from '../../../shared/constants/app';
import {
  CONTENT_SCRIPT,
  LEGACY_PROVIDER,
  LEGACY_PUBLIC_CONFIG,
  METAMASK_COOKIE_HANDLER,
  METAMASK_PROVIDER,
  PHISHING_SAFELIST,
  PHISHING_STREAM,
  PHISHING_WARNING_PAGE,
} from '../constants/stream';
import { logStreamDisconnectWarning, MessageType } from './stream-utils';

const phishingPageUrl = new URL(
  process.env.PHISHING_WARNING_PAGE_URL as string,
);

let phishingExtChannel: Substream,
  phishingExtMux: ObjectMultiplex,
  phishingExtPort: browser.Runtime.Port,
  phishingExtStream: PortStream | null,
  phishingPageChannel: Substream,
  phishingPageMux: ObjectMultiplex,
  extensionPhishingStream: Substream;

/**
 * PHISHING STREAM LOGIC
 */

function setupPhishingPageStreams(): void {
  // the transport-specific streams for communication between inpage and background
  const phishingPageStream = new WindowPostMessageStream({
    name: CONTENT_SCRIPT,
    target: PHISHING_WARNING_PAGE,
  });

  // create and connect channel muxers
  // so we can handle the channels individually
  phishingPageMux = new ObjectMultiplex();
  phishingPageMux.setMaxListeners(25);
  pipeline(phishingPageMux, phishingPageStream, phishingPageMux, (err: Error) =>
    logStreamDisconnectWarning('MetaMask Inpage Multiplex', err),
  );

  phishingPageChannel = phishingPageMux.createStream(PHISHING_SAFELIST);
  phishingPageMux.ignoreStream(METAMASK_COOKIE_HANDLER);
  phishingPageMux.ignoreStream(LEGACY_PUBLIC_CONFIG);
  phishingPageMux.ignoreStream(LEGACY_PROVIDER);
  phishingPageMux.ignoreStream(METAMASK_PROVIDER);
  phishingPageMux.ignoreStream(PHISHING_STREAM);
}

/** Destroys all of the phishing extension streams */
const destroyPhishingExtStreams = (): void => {
  phishingPageChannel.removeAllListeners();

  phishingExtMux.removeAllListeners();
  phishingExtMux.destroy();

  phishingExtChannel.removeAllListeners();
  phishingExtChannel.destroy();

  phishingExtStream = null;
};

export const setupPhishingExtStreams = (): void => {
  phishingExtPort = browser.runtime.connect({
    name: CONTENT_SCRIPT,
  });
  phishingExtStream = new PortStream(phishingExtPort);

  // create and connect channel muxers so we can handle the channels individually
  phishingExtMux = new ObjectMultiplex();
  phishingExtMux.setMaxListeners(25);
  pipeline(phishingExtMux, phishingExtStream, phishingExtMux, (err: Error) => {
    logStreamDisconnectWarning('MetaMask Background Multiplex', err);
    window.postMessage(
      {
        target: PHISHING_WARNING_PAGE, // the post-message-stream "target"
        data: {
          // this object gets passed to @metamask/object-multiplex
          name: PHISHING_SAFELIST, // the @metamask/object-multiplex channel name
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
  pipeline(
    phishingPageChannel,
    phishingExtChannel,
    phishingPageChannel,
    (error: Error) =>
      console.debug(
        `MetaMask: Muxed traffic for channel "${PHISHING_SAFELIST}" failed.`,
        error,
      ),
  );

  phishingExtMux.ignoreStream(METAMASK_COOKIE_HANDLER);
  phishingExtMux.ignoreStream(LEGACY_PUBLIC_CONFIG);
  phishingExtMux.ignoreStream(LEGACY_PROVIDER);
  phishingExtMux.ignoreStream(METAMASK_PROVIDER);
  phishingExtMux.ignoreStream(PHISHING_STREAM);

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  phishingExtPort.onDisconnect.addListener(onDisconnectDestroyPhishingStreams);
};

/**
 * This listener destroys the phishing extension streams when the extension port is disconnected,
 * so that streams may be re-established later the phishing extension port is reconnected.
 */
const onDisconnectDestroyPhishingStreams = (): void => {
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
 * @param msg - The message object
 * @param msg.name - Custom property and name to identify the message received
 */
const onMessageSetUpPhishingStreams = (
  msg: MessageType,
): Promise<string | undefined> | undefined => {
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

export const isDetectedPhishingSite: boolean =
  window.location.origin === phishingPageUrl.origin &&
  window.location.pathname === phishingPageUrl.pathname;

/**
 * Redirects the current page to a phishing information page
 */
export function redirectToPhishingWarning(): void {
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

/**
 * establish a connection between the extension's "phishing" communication channel and a warning system
 * that triggers when a phishing threat is detected.
 *
 * @param extensionMux - The multiplexer used for managing communication channels
 */
export function connectPhishingChannelToWarningSystem(
  extensionMux: ObjectMultiplex,
): void {
  // create a stream specifically for handling phishing-related communications
  extensionPhishingStream = extensionMux.createStream(PHISHING_STREAM);
  extensionMux.ignoreStream(METAMASK_COOKIE_HANDLER);
  extensionMux.ignoreStream(LEGACY_PROVIDER);
  extensionMux.ignoreStream(PHISHING_SAFELIST);
  // an event listener for the first piece of data received on this "phishing" channel.
  // Once data is received, it triggers the redirectToPhishingWarning function
  extensionPhishingStream.once('data', redirectToPhishingWarning);
}

/**
 * Initializes two-way communication streams between the browser extension and
 * the phishing page context. This function also creates an event listener to
 * reset the streams if the service worker resets.
 */
export const initPhishingStreams = (): void => {
  setupPhishingPageStreams();
  setupPhishingExtStreams();

  browser.runtime.onMessage.addListener(onMessageSetUpPhishingStreams);
};
