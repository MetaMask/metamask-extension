import browser from 'webextension-polyfill';
import { WindowPostMessageStream } from '@metamask/post-message-stream';
import ObjectMultiplex from '@metamask/object-multiplex';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error types/readable-stream.d.ts does not get picked up by ts-node
import { pipeline } from 'readable-stream';
import { Substream } from '@metamask/object-multiplex/dist/Substream';
import PortStream from 'extension-port-stream';
import { EXTENSION_MESSAGES } from '../../../shared/constants/app';
import { COOKIE_ID_MARKETING_WHITELIST_ORIGINS } from '../constants/marketing-site-whitelist';
import { checkForLastError } from '../../../shared/modules/browser-runtime.utils';
import {
  METAMASK_COOKIE_HANDLER,
  CONTENT_SCRIPT,
  LEGACY_PUBLIC_CONFIG,
  METAMASK_PROVIDER,
  PHISHING_SAFELIST,
  LEGACY_PROVIDER,
} from '../constants/stream-constant';
import { logStreamDisconnectWarning } from './shared';

export const isDetectedCookieMarketingSite: boolean =
  COOKIE_ID_MARKETING_WHITELIST_ORIGINS.some(
    (origin) => origin === window.location.origin,
  );

let cookieHandlerPageMux: ObjectMultiplex,
  cookieHandlerPageChannel: Substream,
  cookieHandlerExtPort: browser.Runtime.Port,
  cookieHandlerExtStream: PortStream | null,
  cookieHandlerMux: ObjectMultiplex,
  cookieHandlerExtChannel: Substream;

function setupCookieHandlerStreamsFromOrigin(origin: string): void {
  const cookieHandlerPageStream = new WindowPostMessageStream({
    name: CONTENT_SCRIPT,
    target: 'CookieHandlerPage',
    targetWindow: window,
    targetOrigin: origin,
  });

  // create and connect channel muxers
  // so we can handle the channels individually
  cookieHandlerPageMux = new ObjectMultiplex();
  cookieHandlerPageMux.setMaxListeners(25);

  pipeline(
    cookieHandlerPageMux,
    cookieHandlerPageStream,
    cookieHandlerPageMux,
    (err: Error) =>
      logStreamDisconnectWarning('MetaMask Inpage Multiplex', err),
  );

  cookieHandlerPageChannel = cookieHandlerPageMux.createStream(
    METAMASK_COOKIE_HANDLER,
  );
  cookieHandlerPageMux.ignoreStream(LEGACY_PUBLIC_CONFIG);
  cookieHandlerPageMux.ignoreStream(LEGACY_PROVIDER);
  cookieHandlerPageMux.ignoreStream(METAMASK_PROVIDER);
  cookieHandlerPageMux.ignoreStream(PHISHING_SAFELIST);
}

/**
 * establishes a communication stream between the content script and background.js
 */
export const setupCookieHandlerExtStreams = (): void => {
  cookieHandlerExtPort = browser.runtime.connect({
    name: CONTENT_SCRIPT,
  });
  cookieHandlerExtStream = new PortStream(cookieHandlerExtPort);

  // create and connect channel muxers
  // so we can handle the channels individually
  cookieHandlerMux = new ObjectMultiplex();
  cookieHandlerMux.setMaxListeners(25);

  pipeline(
    cookieHandlerMux,
    cookieHandlerExtStream,
    cookieHandlerMux,
    (err: Error) => {
      logStreamDisconnectWarning('MetaMask Background Multiplex', err);
      window.postMessage(
        {
          target: 'CookieHandlerPage',
          data: {
            // this object gets passed to @metamask/object-multiplex
            name: METAMASK_COOKIE_HANDLER, // the @metamask/object-multiplex channel name
            data: {
              jsonrpc: '2.0',
              method: 'METAMASK_STREAM_FAILURE',
            },
          },
        },
        window.location.origin,
      );
    },
  );

  // forward communication across inpage-background for these channels only
  cookieHandlerExtChannel = cookieHandlerMux.createStream(
    METAMASK_COOKIE_HANDLER,
  );
  cookieHandlerMux.ignoreStream(LEGACY_PUBLIC_CONFIG);
  cookieHandlerMux.ignoreStream(LEGACY_PROVIDER);
  cookieHandlerMux.ignoreStream(METAMASK_PROVIDER);
  cookieHandlerMux.ignoreStream(PHISHING_SAFELIST);
  pipeline(
    cookieHandlerPageChannel,
    cookieHandlerExtChannel,
    cookieHandlerPageChannel,
    (error: Error) =>
      console.debug(
        `MetaMask: Muxed traffic for channel "${METAMASK_COOKIE_HANDLER}" failed.`,
        error,
      ),
  );

  cookieHandlerExtPort.onDisconnect.addListener(
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    onDisconnectDestroyCookieStreams,
  );
};

/** Destroys all of the cookie handler extension streams */
const destroyCookieExtStreams = () => {
  cookieHandlerPageChannel.removeAllListeners();

  cookieHandlerMux.removeAllListeners();
  cookieHandlerMux.destroy();

  cookieHandlerExtChannel.removeAllListeners();
  cookieHandlerExtChannel.destroy();

  cookieHandlerExtStream = null;
};

/**
 * This listener destroys the phishing extension streams when the extension port is disconnected,
 * so that streams may be re-established later the phishing extension port is reconnected.
 */
const onDisconnectDestroyCookieStreams = () => {
  const err = checkForLastError();

  cookieHandlerExtPort.onDisconnect.removeListener(
    onDisconnectDestroyCookieStreams,
  );

  destroyCookieExtStreams();

  /**
   * If an error is found, reset the streams. When running two or more dapps, resetting the service
   * worker may cause the error, "Error: Could not establish connection. Receiving end does not
   * exist.", due to a race-condition. The disconnect event may be called by runtime.connect which
   * may cause issues. We suspect that this is a chromium bug as this event should only be called
   * once the port and connections are ready. Delay time is arbitrary.
   */
  if (err) {
    console.warn(`${err} Resetting the phishing streams.`);
    setTimeout(setupCookieHandlerExtStreams, 1000);
  }
};

const onMessageSetUpCookieHandlerStreams = (msg: {
  name: string;
  origin: string;
}): Promise<string | undefined> | undefined => {
  if (msg.name === EXTENSION_MESSAGES.READY) {
    if (!cookieHandlerExtStream) {
      setupCookieHandlerExtStreams();
    }
    return Promise.resolve(
      `MetaMask: handled "${EXTENSION_MESSAGES.READY}" for phishing streams`,
    );
  }
  return undefined;
};

/**
 * Initializes two-way communication streams between the browser extension and
 * the cookie id submission page context. This function also creates an event listener to
 * reset the streams if the service worker resets.
 */
export const initializeCookieHandlerSteam = (): void => {
  const { origin } = window.location;
  setupCookieHandlerStreamsFromOrigin(origin);
  setupCookieHandlerExtStreams();
  browser.runtime.onMessage.addListener(onMessageSetUpCookieHandlerStreams);
};
