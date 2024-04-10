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

// Variables used to avoid showing the toast
// upon page load (i.e. cut down on noisiness)
let showChainChanged = false;
const ignoreSeconds = 5;
setTimeout(() => {
  showChainChanged = true;
}, ignoreSeconds * 1000);
let lastMessage = '';

// Tracking the setTimeout in case another event comes
// and we need to cancel the original
let injectTimeout = null;

// Keep a handle of the injected node for removal and to avoid
// duplicate injections
let node;

/**
 * The function notifies inpage when the extension stream connection is ready. When the
 * 'metamask_chainChanged' method is received from the extension, it implies that the
 * background state is completely initialized and it is ready to process method calls.
 * This is used as a notification to replay any pending messages in MV3.
 *
 * @param {object} msg - instance of message received
 */
function extensionStreamMessageListener(msg) {
  // Shows in-page toast when the chain changes
  if (msg.data.method === 'metamask_chainChanged' && msg.data.params.message) {
    const toastDisplaySeconds = 5;
    const { message } = msg.data.params;

    // To prevent noisiness, don't show the toast if the message is the same
    // as the last toast contents
    if (message === lastMessage) {
      return;
    }
    lastMessage = message;

    // MetaMask logo
    const image = `data:image/svg+xml,%3Csvg fill='none' height='33' viewBox='0 0 35 33' width='35' xmlns='http://www.w3.org/2000/svg'%3E%3Cg stroke-linecap='round' stroke-linejoin='round' stroke-width='.25'%3E%3Cpath d='m32.9582 1-13.1341 9.7183 2.4424-5.72731z' fill='%23e17726' stroke='%23e17726'/%3E%3Cg fill='%23e27625' stroke='%23e27625'%3E%3Cpath d='m2.66296 1 13.01714 9.809-2.3254-5.81802z'/%3E%3Cpath d='m28.2295 23.5335-3.4947 5.3386 7.4829 2.0603 2.1436-7.2823z'/%3E%3Cpath d='m1.27281 23.6501 2.13055 7.2823 7.46994-2.0603-3.48166-5.3386z'/%3E%3Cpath d='m10.4706 14.5149-2.0786 3.1358 7.405.3369-.2469-7.969z'/%3E%3Cpath d='m25.1505 14.5149-5.1575-4.58704-.1688 8.05974 7.4049-.3369z'/%3E%3Cpath d='m10.8733 28.8721 4.4819-2.1639-3.8583-3.0062z'/%3E%3Cpath d='m20.2659 26.7082 4.4689 2.1639-.6105-5.1701z'/%3E%3C/g%3E%3Cpath d='m24.7348 28.8721-4.469-2.1639.3638 2.9025-.039 1.231z' fill='%23d5bfb2' stroke='%23d5bfb2'/%3E%3Cpath d='m10.8732 28.8721 4.1572 1.9696-.026-1.231.3508-2.9025z' fill='%23d5bfb2' stroke='%23d5bfb2'/%3E%3Cpath d='m15.1084 21.7842-3.7155-1.0884 2.6243-1.2051z' fill='%23233447' stroke='%23233447'/%3E%3Cpath d='m20.5126 21.7842 1.0913-2.2935 2.6372 1.2051z' fill='%23233447' stroke='%23233447'/%3E%3Cg fill='%23cc6228' stroke='%23cc6228'%3E%3Cpath d='m10.8733 28.8721.6495-5.3386-4.13117.1167z'/%3E%3Cpath d='m24.0982 23.5335.6366 5.3386 3.4946-5.2219z'/%3E%3Cpath d='m27.2291 17.6507-7.405.3369.6885 3.7966 1.0913-2.2935 2.6372 1.2051z'/%3E%3Cpath d='m11.3929 20.6958 2.6242-1.2051 1.0913 2.2935.6885-3.7966-7.40495-.3369z'/%3E%3C/g%3E%3Cpath d='m8.392 17.6507 3.1049 6.0513-.1039-3.0062z' fill='%23e27525' stroke='%23e27525'/%3E%3Cpath d='m24.2412 20.6958-.1169 3.0062 3.1049-6.0513z' fill='%23e27525' stroke='%23e27525'/%3E%3Cpath d='m15.797 17.9876-.6886 3.7967.8704 4.4833.1949-5.9087z' fill='%23e27525' stroke='%23e27525'/%3E%3Cpath d='m19.8242 17.9876-.3638 2.3584.1819 5.9216.8704-4.4833z' fill='%23e27525' stroke='%23e27525'/%3E%3Cpath d='m20.5127 21.7842-.8704 4.4834.6236.4406 3.8584-3.0062.1169-3.0062z' fill='%23f5841f' stroke='%23f5841f'/%3E%3Cpath d='m11.3929 20.6958.104 3.0062 3.8583 3.0062.6236-.4406-.8704-4.4834z' fill='%23f5841f' stroke='%23f5841f'/%3E%3Cpath d='m20.5906 30.8417.039-1.231-.3378-.2851h-4.9626l-.3248.2851.026 1.231-4.1572-1.9696 1.4551 1.1921 2.9489 2.0344h5.0536l2.962-2.0344 1.442-1.1921z' fill='%23c0ac9d' stroke='%23c0ac9d'/%3E%3Cpath d='m20.2659 26.7082-.6236-.4406h-3.6635l-.6236.4406-.3508 2.9025.3248-.2851h4.9626l.3378.2851z' fill='%23161616' stroke='%23161616'/%3E%3Cpath d='m33.5168 11.3532 1.1043-5.36447-1.6629-4.98873-12.6923 9.3944 4.8846 4.1205 6.8983 2.0085 1.52-1.7752-.6626-.4795 1.0523-.9588-.8054-.622 1.0523-.8034z' fill='%23763e1a' stroke='%23763e1a'/%3E%3Cpath d='m1 5.98873 1.11724 5.36447-.71451.5313 1.06527.8034-.80545.622 1.05228.9588-.66255.4795 1.51997 1.7752 6.89835-2.0085 4.8846-4.1205-12.69233-9.3944z' fill='%23763e1a' stroke='%23763e1a'/%3E%3Cpath d='m32.0489 16.5234-6.8983-2.0085 2.0786 3.1358-3.1049 6.0513 4.1052-.0519h6.1318z' fill='%23f5841f' stroke='%23f5841f'/%3E%3Cpath d='m10.4705 14.5149-6.89828 2.0085-2.29944 7.1267h6.11883l4.10519.0519-3.10487-6.0513z' fill='%23f5841f' stroke='%23f5841f'/%3E%3Cpath d='m19.8241 17.9876.4417-7.5932 2.0007-5.4034h-8.9119l2.0006 5.4034.4417 7.5932.1689 2.3842.013 5.8958h3.6635l.013-5.8958z' fill='%23f5841f' stroke='%23f5841f'/%3E%3C/g%3E%3C/svg%3E`;

    const isDarkMode = Boolean(
      window?.matchMedia('(prefers-color-scheme: dark)')?.matches,
    );

    // Remove any previous notification if the user
    // changes networks quickly
    const removeToast = () => {
      if (node) {
        node.parentNode.removeChild(node);
        node = null;
        clearTimeout(injectTimeout);
      }
    };

    const themeStyles = isDarkMode
      ? `
      background-color: #fff;
      border: 1px solid #d6d9dc;
      color: #141618;
      filter: drop-shadow(#000 0 2px 16px);
    `
      : `
      background-color: #24272a;
      border: 1px solid #3b4046;
      color: #fff;
      filter: drop-shadow(#3b4046 0 2px 16px);
    `;

    const wrapperStyles = `
      top: 80px;
      right: 103px;
      position: fixed;
      z-index: 9999999;
      border-radius: 8px;
      cursor: default;
      max-width: 344px;
    `;

    const designStyles = `
      display: flex;
      gap: 12px;
      align-items: center;
      padding: 8px 12px;
      line-height: 150%;
      font-family: 'Inter';
      font-size: 16px;
    `;

    if (showChainChanged) {
      removeToast();

      node = document.createElement('div');
      node.innerHTML = `<div style="${themeStyles} ${wrapperStyles}" data-testid="switch-network-toast">
          <div style="${designStyles}">
            <div style="display: contents;">
              <img src="${image}" width="24" height="24" alt="MetaMask" />
            </div>
            <div>${message}</div>
          </div>
        </div>
      `;
      document.body.appendChild(node);

      // Automatically remove the notification after a given
      // amount of time to make the UI less noisy
      injectTimeout = setTimeout(removeToast, toastDisplaySeconds * 1000);
    }
  }

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
