import browser from 'webextension-polyfill';
import { WindowPostMessageStream } from '@metamask/post-message-stream';
import ObjectMultiplex from '@metamask/object-multiplex';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error types/readable-stream.d.ts does not get picked up by ts-node
import { pipeline } from 'readable-stream';
import { logStreamDisconnectWarning } from './shared';
import { Substream } from '@metamask/object-multiplex/dist/Substream';
import PortStream from 'extension-port-stream';
import { EXTENSION_MESSAGES } from '../../../shared/constants/app';
import { COOKIE_ID_MARKETING_WHITELIST_ORIGINS } from '../constants/marketing-site-whitelist';

const CONTENT_SCRIPT = 'metamask-contentscript';
const METAMASK_COOKIE_HANDLER = 'metamask-cookie-handler';

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

  cookieHandlerPageStream.on('data', (data) => {
    console.log('Received setupCookieHandlerStreamsFromOrigin:', data);
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

  cookieHandlerPageChannel.on('data', (data) => {
    console.log('Received cookieHandlerPageChannel:', data);
  });
}

/**
 *  establishes a communication stream between the content script and background.js
 */
export const setupCookieHandlerExtStreams = (origin): void => {
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

  cookieHandlerExtChannel.on('data', (data) => {
    console.log('cookieHandlerExtChannel to content script:', data);
  });

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  // cookieHandlerExtPort.onDisconnect.addListener(onDisconnectDestroyPhishingStreams);
};

const onMessageSetUpCookieHandlerStreams = (msg: {
  name: string;
  origin: string;
}): Promise<string | undefined> | undefined => {
  if (msg.name === EXTENSION_MESSAGES.READY) {
    if (!cookieHandlerExtStream) {
      setupCookieHandlerExtStreams(origin);
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
  const origin = window.location.origin;
  setupCookieHandlerStreamsFromOrigin(origin);
  setupCookieHandlerExtStreams(origin);
  browser.runtime.onMessage.addListener(onMessageSetUpCookieHandlerStreams);
};
